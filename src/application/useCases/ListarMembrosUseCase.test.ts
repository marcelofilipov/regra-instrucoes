import { describe, it, expect, beforeEach } from 'vitest'
import { ListarMembrosUseCase } from './ListarMembrosUseCase'
import { ObterMembroUseCase } from './ObterMembroUseCase'
import { MembroRepositoryEmMemoria } from '@/test/fakes/MembroRepositoryEmMemoria'
import { Membro } from '@/domain/entities/Membro'
import { Grau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'

let membros: MembroRepositoryEmMemoria

async function semear(id: string, nome: string): Promise<void> {
  await membros.salvar(
    Membro.cadastrar({
      id,
      nome,
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: null,
      quando: new Date('2026-01-01'),
    }),
  )
}

beforeEach(() => {
  membros = new MembroRepositoryEmMemoria()
})

describe('ListarMembrosUseCase', () => {
  it('devolve os membros em ordem alfabética', async () => {
    await semear('m1', 'Ricardo')
    await semear('m2', 'Antônio')
    await semear('m3', 'Marcelo')

    const listados = await new ListarMembrosUseCase({ membros }).executar()

    expect(listados.map((m) => m.nome)).toEqual([
      'Antônio',
      'Marcelo',
      'Ricardo',
    ])
  })

  it('devolve lista vazia quando não há membros', async () => {
    expect(await new ListarMembrosUseCase({ membros }).executar()).toEqual([])
  })
})

describe('ObterMembroUseCase', () => {
  it('carrega o membro pedido', async () => {
    await semear('m1', 'Marcelo')

    const membro = await new ObterMembroUseCase({ membros }).executar('m1')

    expect(membro.nome).toBe('Marcelo')
  })

  it('trata ausência como erro', async () => {
    await expect(
      new ObterMembroUseCase({ membros }).executar('fantasma'),
    ).rejects.toThrow(DomainError)
  })
})
