import { describe, it, expect, beforeEach } from 'vitest'
import { AlterarDataInstrucaoUseCase } from './AlterarDataInstrucaoUseCase'
import { InstrucaoRepositoryEmMemoria } from '@/test/fakes/InstrucaoRepositoryEmMemoria'
import { admin, editor, leitor } from '@/test/fixtures/usuarios'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

const AGORA = new Date('2026-08-11T12:00:00Z')
const DATA_ORIGINAL = new Date('2026-03-10')
const DATA_CORRIGIDA = new Date('2026-03-17')

let instrucoes: InstrucaoRepositoryEmMemoria
let alterarData: AlterarDataInstrucaoUseCase

beforeEach(async () => {
  instrucoes = new InstrucaoRepositoryEmMemoria()
  alterarData = new AlterarDataInstrucaoUseCase({
    instrucoes,
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

  it('recusa instrução inexistente', async () => {
    await expect(
      alterarData.executar(admin(), {
        instrucaoId: 'fantasma',
        novaData: DATA_CORRIGIDA,
      }),
    ).rejects.toThrow(DomainError)
  })
})
