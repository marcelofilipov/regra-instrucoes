import { describe, it, expect, beforeEach } from 'vitest'
import { ExportarDadosUseCase } from './ExportarDadosUseCase'
import { AlterarDataInstrucaoUseCase } from './AlterarDataInstrucaoUseCase'
import { MembroRepositoryEmMemoria } from '@/test/fakes/MembroRepositoryEmMemoria'
import { InstrucaoRepositoryEmMemoria } from '@/test/fakes/InstrucaoRepositoryEmMemoria'
import { AuditoriaRepositoryEmMemoria } from '@/test/fakes/AuditoriaRepositoryEmMemoria'
import { UsuarioRepositoryEmMemoria } from '@/test/fakes/UsuarioRepositoryEmMemoria'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { admin, editor, leitor } from '@/test/fixtures/usuarios'
import { Membro } from '@/domain/entities/Membro'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

const GERADO_EM = new Date(2026, 7, 11, 14, 30)
const DEZ_DE_MARCO = new Date(2026, 2, 10, 12)

let membros: MembroRepositoryEmMemoria
let instrucoes: InstrucaoRepositoryEmMemoria
let auditoria: AuditoriaRepositoryEmMemoria
let usuarios: UsuarioRepositoryEmMemoria
let exportar: ExportarDadosUseCase

beforeEach(async () => {
  membros = new MembroRepositoryEmMemoria()
  auditoria = new AuditoriaRepositoryEmMemoria()
  instrucoes = new InstrucaoRepositoryEmMemoria(auditoria)
  usuarios = new UsuarioRepositoryEmMemoria()
  exportar = new ExportarDadosUseCase({
    membros,
    instrucoes,
    auditoria,
    usuarios,
    agora: () => GERADO_EM,
  })

  await membros.salvar(
    Membro.cadastrar({
      id: 'm1',
      nome: 'Marcelo Rodrigo',
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: DEZ_DE_MARCO,
      quando: DEZ_DE_MARCO,
    }),
  )
  await instrucoes.salvar(
    Instrucao.registrar({
      id: 'i1',
      membroId: 'm1',
      grau: Grau.APRENDIZ,
      numero: 1,
      dataRecebimento: DEZ_DE_MARCO,
      registradoPor: editor().id,
      registradoEm: DEZ_DE_MARCO,
    }),
  )
  await usuarios.salvar(admin())
  await usuarios.salvar(editor())
})

describe('ExportarDadosUseCase', () => {
  it('admin leva as quatro coleções na cópia', async () => {
    const snapshot = await exportar.executar(admin())

    expect(snapshot.membros).toHaveLength(1)
    expect(snapshot.instrucoes).toHaveLength(1)
    expect(snapshot.usuarios).toHaveLength(2)
    expect(snapshot.auditoria).toHaveLength(0)
  })

  it('carimba quem gerou e quando', async () => {
    const snapshot = await exportar.executar(admin())

    expect(snapshot.geradoEm).toEqual(GERADO_EM)
    expect(snapshot.geradoPor).toBe(admin().email)
  })

  it('a trilha de auditoria entra na cópia', async () => {
    await new AlterarDataInstrucaoUseCase({
      instrucoes,
      geradorDeId: new GeradorDeIdFake(),
    }).executar(admin(), {
      instrucaoId: 'i1',
      novaData: new Date(2026, 2, 17, 12),
    })

    const snapshot = await exportar.executar(admin())

    expect(snapshot.auditoria).toHaveLength(1)
    expect(snapshot.auditoria[0].instrucaoId).toBe('i1')
  })

  it('editor não exporta', async () => {
    await expect(exportar.executar(editor())).rejects.toThrow(
      PermissaoNegadaError,
    )
  })

  it('leitor não exporta', async () => {
    await expect(exportar.executar(leitor())).rejects.toThrow(
      PermissaoNegadaError,
    )
  })

  it('Loja vazia exporta cópia vazia, não quebra', async () => {
    membros.salvos.clear()
    instrucoes.salvos.clear()
    usuarios.salvos.clear()

    const snapshot = await exportar.executar(admin())

    expect(snapshot.membros).toEqual([])
    expect(snapshot.instrucoes).toEqual([])
  })
})
