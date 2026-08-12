import { describe, it, expect, beforeEach } from 'vitest'
import { AlterarDataInstrucaoUseCase } from './AlterarDataInstrucaoUseCase'
import { InstrucaoRepositoryEmMemoria } from '@/test/fakes/InstrucaoRepositoryEmMemoria'
import { AuditoriaRepositoryEmMemoria } from '@/test/fakes/AuditoriaRepositoryEmMemoria'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { admin, editor, leitor } from '@/test/fixtures/usuarios'
import { Instrucao } from '@/domain/entities/Instrucao'
import { CAMPO_DATA_RECEBIMENTO } from '@/domain/entities/RegistroDeAuditoria'
import { Grau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

const AGORA = new Date('2026-08-11T12:00:00Z')
const DATA_ORIGINAL = new Date(2026, 2, 10, 12)
const DATA_CORRIGIDA = new Date(2026, 2, 17, 12)

let instrucoes: InstrucaoRepositoryEmMemoria
let auditoria: AuditoriaRepositoryEmMemoria
let alterarData: AlterarDataInstrucaoUseCase

beforeEach(async () => {
  auditoria = new AuditoriaRepositoryEmMemoria()
  instrucoes = new InstrucaoRepositoryEmMemoria(auditoria)
  alterarData = new AlterarDataInstrucaoUseCase({
    instrucoes,
    geradorDeId: new GeradorDeIdFake(),
    agora: () => AGORA,
  })

  await instrucoes.salvar(
    Instrucao.registrar({
      id: 'i1',
      membroId: 'membro-1',
      grau: Grau.APRENDIZ,
      numero: 1,
      dataRecebimento: DATA_ORIGINAL,
      registradoPor: 'uid-editor',
      registradoEm: DATA_ORIGINAL,
    }),
  )
})

describe('AlterarDataInstrucaoUseCase', () => {
  it('admin corrige a data e a alteração fica rastreada', async () => {
    const corrigida = await alterarData.executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })

    expect(corrigida.dataRecebimento).toEqual(DATA_CORRIGIDA)
    expect(corrigida.alteradoPor).toBe(admin().id)
    expect(corrigida.alteradoEm).toEqual(AGORA)
  })

  it('persiste a correção', async () => {
    await alterarData.executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })

    const gravada = await instrucoes.buscarPorId('i1')
    expect(gravada!.dataRecebimento).toEqual(DATA_CORRIGIDA)
  })

  it('grava o log de auditoria com o valor de antes e o de depois', async () => {
    await alterarData.executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })

    expect(auditoria.registrados).toHaveLength(1)
    const [registro] = auditoria.registrados
    expect(registro.instrucaoId).toBe('i1')
    expect(registro.campoAlterado).toBe(CAMPO_DATA_RECEBIMENTO)
    expect(new Date(registro.valorAnterior)).toEqual(DATA_ORIGINAL)
    expect(new Date(registro.valorNovo)).toEqual(DATA_CORRIGIDA)
    expect(registro.alteradoPor).toBe(admin().id)
    expect(registro.alteradoEm).toEqual(AGORA)
  })

  it('duas correções deixam duas linhas na trilha, na ordem em que ocorreram', async () => {
    await alterarData.executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })
    await alterarData.executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_ORIGINAL,
    })

    expect(auditoria.registrados.map((r) => new Date(r.valorNovo))).toEqual([
      DATA_CORRIGIDA,
      DATA_ORIGINAL,
    ])
  })

  it('editor não corrige data já registrada', async () => {
    await expect(
      alterarData.executar(editor(), {
        instrucaoId: 'i1',
        novaData: DATA_CORRIGIDA,
      }),
    ).rejects.toThrow(PermissaoNegadaError)
  })

  it('leitor não corrige e o dado original permanece', async () => {
    await expect(
      alterarData.executar(leitor(), {
        instrucaoId: 'i1',
        novaData: DATA_CORRIGIDA,
      }),
    ).rejects.toThrow(PermissaoNegadaError)

    const intacta = await instrucoes.buscarPorId('i1')
    expect(intacta!.dataRecebimento).toEqual(DATA_ORIGINAL)
  })

  it('tentativa recusada não deixa rastro na auditoria', async () => {
    await expect(
      alterarData.executar(editor(), {
        instrucaoId: 'i1',
        novaData: DATA_CORRIGIDA,
      }),
    ).rejects.toThrow(PermissaoNegadaError)

    expect(auditoria.registrados).toHaveLength(0)
  })

  it('recusa instrução inexistente', async () => {
    await expect(
      alterarData.executar(admin(), {
        instrucaoId: 'fantasma',
        novaData: DATA_CORRIGIDA,
      }),
    ).rejects.toThrow(DomainError)
  })
})
