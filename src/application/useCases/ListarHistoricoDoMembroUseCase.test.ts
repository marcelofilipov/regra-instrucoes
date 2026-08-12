import { describe, it, expect, beforeEach } from 'vitest'
import { ListarHistoricoDoMembroUseCase } from './ListarHistoricoDoMembroUseCase'
import { AlterarDataInstrucaoUseCase } from './AlterarDataInstrucaoUseCase'
import { InstrucaoRepositoryEmMemoria } from '@/test/fakes/InstrucaoRepositoryEmMemoria'
import { AuditoriaRepositoryEmMemoria } from '@/test/fakes/AuditoriaRepositoryEmMemoria'
import { UsuarioRepositoryEmMemoria } from '@/test/fakes/UsuarioRepositoryEmMemoria'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { admin } from '@/test/fixtures/usuarios'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'

const DATA_ORIGINAL = new Date(2026, 2, 10, 12)
const DATA_CORRIGIDA = new Date(2026, 2, 17, 12)
const PRIMEIRA_CORRECAO = new Date(2026, 7, 1, 10)
const SEGUNDA_CORRECAO = new Date(2026, 7, 2, 10)

let instrucoes: InstrucaoRepositoryEmMemoria
let auditoria: AuditoriaRepositoryEmMemoria
let usuarios: UsuarioRepositoryEmMemoria
let historico: ListarHistoricoDoMembroUseCase

function corrigirEm(quando: Date): AlterarDataInstrucaoUseCase {
  return new AlterarDataInstrucaoUseCase({
    instrucoes,
    geradorDeId: new GeradorDeIdFake(),
    agora: () => quando,
  })
}

async function instrucaoDe(id: string, membroId: string, numero: number) {
  await instrucoes.salvar(
    Instrucao.registrar({
      id,
      membroId,
      grau: Grau.APRENDIZ,
      numero,
      dataRecebimento: DATA_ORIGINAL,
      registradoPor: 'uid-editor',
      registradoEm: DATA_ORIGINAL,
    }),
  )
}

beforeEach(async () => {
  auditoria = new AuditoriaRepositoryEmMemoria()
  instrucoes = new InstrucaoRepositoryEmMemoria(auditoria)
  usuarios = new UsuarioRepositoryEmMemoria()
  historico = new ListarHistoricoDoMembroUseCase({
    instrucoes,
    auditoria,
    usuarios,
  })

  await usuarios.salvar(admin())
  await instrucaoDe('i1', 'membro-1', 1)
  await instrucaoDe('i2', 'membro-1', 2)
  await instrucaoDe('i3', 'membro-2', 1)
})

describe('ListarHistoricoDoMembroUseCase', () => {
  it('ficha sem correção nenhuma tem histórico vazio', async () => {
    expect(await historico.executar('membro-1')).toEqual([])
  })

  it('traz a correção com a instrução que ela alterou', async () => {
    await corrigirEm(PRIMEIRA_CORRECAO).executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })

    const alteracoes = await historico.executar('membro-1')

    expect(alteracoes).toHaveLength(1)
    expect(alteracoes[0].instrucao.numero).toBe(1)
    expect(new Date(alteracoes[0].registro.valorAnterior)).toEqual(DATA_ORIGINAL)
  })

  it('resolve o uid do autor para o nome do perfil', async () => {
    await corrigirEm(PRIMEIRA_CORRECAO).executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })

    const [alteracao] = await historico.executar('membro-1')
    expect(alteracao.autor).toBe(admin().nome)
  })

  it('perfil apagado não some do histórico: cai de volta no uid', async () => {
    usuarios.salvos.clear()
    await corrigirEm(PRIMEIRA_CORRECAO).executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })

    const [alteracao] = await historico.executar('membro-1')
    expect(alteracao.autor).toBe(admin().id)
  })

  it('ordena do mais recente para o mais antigo', async () => {
    await corrigirEm(PRIMEIRA_CORRECAO).executar(admin(), {
      instrucaoId: 'i1',
      novaData: DATA_CORRIGIDA,
    })
    await corrigirEm(SEGUNDA_CORRECAO).executar(admin(), {
      instrucaoId: 'i2',
      novaData: DATA_CORRIGIDA,
    })

    const alteracoes = await historico.executar('membro-1')

    expect(alteracoes.map((a) => a.instrucao.id)).toEqual(['i2', 'i1'])
  })

  it('não vaza correção de instrução de outro membro', async () => {
    await corrigirEm(PRIMEIRA_CORRECAO).executar(admin(), {
      instrucaoId: 'i3',
      novaData: DATA_CORRIGIDA,
    })

    expect(await historico.executar('membro-1')).toEqual([])
  })
})
