import { describe, it, expect, beforeEach } from 'vitest'
import { ListarProgressoDosMembrosUseCase } from './ListarProgressoDosMembrosUseCase'
import { ListarMembrosUseCase } from './ListarMembrosUseCase'
import { MembroRepositoryEmMemoria } from '@/test/fakes/MembroRepositoryEmMemoria'
import { InstrucaoRepositoryEmMemoria } from '@/test/fakes/InstrucaoRepositoryEmMemoria'
import { Membro } from '@/domain/entities/Membro'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'

let membros: MembroRepositoryEmMemoria
let instrucoes: InstrucaoRepositoryEmMemoria
let painel: ListarProgressoDosMembrosUseCase

async function semearMembro(id: string, nome: string, grauAtual: Grau) {
  await membros.salvar(
    Membro.cadastrar({
      id,
      nome,
      grauAtual,
      dataIniciacao: null,
      quando: new Date('2026-01-01'),
    }),
  )
}

async function semearInstrucao(membroId: string, grau: Grau, numero: number) {
  await instrucoes.salvar(
    Instrucao.registrar({
      id: `${membroId}-${grau}-${numero}`,
      membroId,
      grau,
      numero,
      dataRecebimento: new Date('2026-03-10'),
      registradoPor: 'uid-editor',
      registradoEm: new Date('2026-03-10'),
    }),
  )
}

beforeEach(() => {
  membros = new MembroRepositoryEmMemoria()
  instrucoes = new InstrucaoRepositoryEmMemoria()
  painel = new ListarProgressoDosMembrosUseCase({
    listarMembros: new ListarMembrosUseCase({ membros }),
    instrucoes,
  })
})

describe('ListarProgressoDosMembrosUseCase', () => {
  it('mede cada membro contra o total do grau em que está', async () => {
    await semearMembro('m1', 'Marcelo', Grau.APRENDIZ)
    await semearInstrucao('m1', Grau.APRENDIZ, 1)
    await semearInstrucao('m1', Grau.APRENDIZ, 2)

    const [linha] = await painel.executar()

    expect(linha.progressoAtual.registradas).toBe(2)
    expect(linha.progressoAtual.total).toBe(7)
  })

  it('não mistura instruções de outro membro', async () => {
    await semearMembro('m1', 'Antônio', Grau.APRENDIZ)
    await semearMembro('m2', 'Marcelo', Grau.APRENDIZ)
    await semearInstrucao('m2', Grau.APRENDIZ, 1)

    const [antonio, marcelo] = await painel.executar()

    expect(antonio.progressoAtual.registradas).toBe(0)
    expect(marcelo.progressoAtual.registradas).toBe(1)
  })

  it('conta só o grau atual de quem já progrediu', async () => {
    await semearMembro('m1', 'Marcelo', Grau.COMPANHEIRO)
    await semearInstrucao('m1', Grau.APRENDIZ, 1)
    await semearInstrucao('m1', Grau.COMPANHEIRO, 1)

    const [linha] = await painel.executar()

    expect(linha.progressoAtual.grau).toBe(Grau.COMPANHEIRO)
    expect(linha.progressoAtual.registradas).toBe(1)
    expect(linha.progressoAtual.total).toBe(5)
  })

  it('devolve painel vazio quando não há membros', async () => {
    expect(await painel.executar()).toEqual([])
  })
})
