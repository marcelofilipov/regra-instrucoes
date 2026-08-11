import { describe, it, expect, beforeEach } from 'vitest'
import { ListarInstrucoesPorMembroUseCase } from './ListarInstrucoesPorMembroUseCase'
import { InstrucaoRepositoryEmMemoria } from '@/test/fakes/InstrucaoRepositoryEmMemoria'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'

let instrucoes: InstrucaoRepositoryEmMemoria
let listar: ListarInstrucoesPorMembroUseCase

async function semear(
  id: string,
  membroId: string,
  grau: Grau,
  numero: number,
): Promise<void> {
  await instrucoes.salvar(
    Instrucao.registrar({
      id,
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
  instrucoes = new InstrucaoRepositoryEmMemoria()
  listar = new ListarInstrucoesPorMembroUseCase({ instrucoes })
})

describe('ListarInstrucoesPorMembroUseCase', () => {
  it('ordena por grau da progressão e, dentro do grau, por número', async () => {
    await semear('c1', 'membro-1', Grau.COMPANHEIRO, 1)
    await semear('a2', 'membro-1', Grau.APRENDIZ, 2)
    await semear('a1', 'membro-1', Grau.APRENDIZ, 1)

    const historico = await listar.executar('membro-1')

    expect(historico.map((i) => i.id)).toEqual(['a1', 'a2', 'c1'])
  })

  it('traz só as instruções do membro pedido', async () => {
    await semear('a1', 'membro-1', Grau.APRENDIZ, 1)
    await semear('b1', 'membro-2', Grau.APRENDIZ, 1)

    const historico = await listar.executar('membro-1')

    expect(historico).toHaveLength(1)
    expect(historico[0].membroId).toBe('membro-1')
  })

  it('devolve lista vazia para membro sem instruções', async () => {
    expect(await listar.executar('membro-sem-nada')).toEqual([])
  })
})
