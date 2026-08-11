import { describe, it, expect, beforeEach } from 'vitest'
import { CadastrarMembroUseCase } from './CadastrarMembroUseCase'
import { MembroRepositoryEmMemoria } from '@/test/fakes/MembroRepositoryEmMemoria'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { admin, editor, leitor } from '@/test/fixtures/usuarios'
import { Grau } from '@/domain/enums/Grau'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'
import { DomainError } from '@/domain/errors/DomainError'

const AGORA = new Date('2026-08-11T12:00:00Z')

const dadosValidos = {
  nome: 'Marcelo Rodrigo',
  grauAtual: Grau.APRENDIZ,
  dataIniciacao: new Date('2026-01-01'),
}

let membros: MembroRepositoryEmMemoria
let cadastrar: CadastrarMembroUseCase

beforeEach(() => {
  membros = new MembroRepositoryEmMemoria()
  cadastrar = new CadastrarMembroUseCase({
    membros,
    geradorDeId: new GeradorDeIdFake(),
    agora: () => AGORA,
  })
})

describe('CadastrarMembroUseCase', () => {
  it('editor cadastra um membro ativo', async () => {
    const membro = await cadastrar.executar(editor(), dadosValidos)

    expect(membro.id).toBe('id-1')
    expect(membro.ativo).toBe(true)
    expect(membro.criadoEm).toEqual(AGORA)
    expect(membros.salvos.size).toBe(1)
  })

  it('admin também cadastra', async () => {
    await expect(cadastrar.executar(admin(), dadosValidos)).resolves.toBeDefined()
  })

  it('leitor não cadastra e nada é gravado', async () => {
    await expect(cadastrar.executar(leitor(), dadosValidos)).rejects.toThrow(
      PermissaoNegadaError,
    )

    expect(membros.salvos.size).toBe(0)
  })

  it('recusa nome em branco', async () => {
    await expect(
      cadastrar.executar(editor(), { ...dadosValidos, nome: '   ' }),
    ).rejects.toThrow(DomainError)
  })
})
