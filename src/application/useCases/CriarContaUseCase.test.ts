import { describe, it, expect, beforeEach } from 'vitest'
import { CriarContaUseCase } from './CriarContaUseCase'
import { GarantirPerfilUseCase } from './GarantirPerfilUseCase'
import { ProvedorAutenticacaoFake } from '@/test/fakes/ProvedorAutenticacaoFake'
import { UsuarioRepositoryEmMemoria } from '@/test/fakes/UsuarioRepositoryEmMemoria'
import { AutenticacaoError } from '@/domain/errors/AutenticacaoError'
import { DomainError } from '@/domain/errors/DomainError'
import { Papel } from '@/domain/enums/Papel'

let provedor: ProvedorAutenticacaoFake
let repositorio: UsuarioRepositoryEmMemoria
let criarConta: CriarContaUseCase

const dadosValidos = {
  nome: 'Novo Irmão',
  email: 'novo@loja.test',
  senha: 'segredo123',
}

beforeEach(() => {
  provedor = new ProvedorAutenticacaoFake()
  repositorio = new UsuarioRepositoryEmMemoria()
  criarConta = new CriarContaUseCase(
    provedor,
    new GarantirPerfilUseCase(repositorio),
  )
})

describe('CriarContaUseCase', () => {
  it('cria a conta e o perfil de leitor', async () => {
    const usuario = await criarConta.executar(dadosValidos)

    expect(usuario.nome).toBe('Novo Irmão')
    expect(usuario.papel).toBe(Papel.LEITOR)
    expect(repositorio.salvos.get(usuario.id)?.papel).toBe(Papel.LEITOR)
  })

  it('recusa nome em branco antes de criar a conta', async () => {
    await expect(
      criarConta.executar({ ...dadosValidos, nome: '   ' }),
    ).rejects.toThrow(DomainError)

    expect(repositorio.salvos.size).toBe(0)
  })

  it('propaga e-mail já cadastrado', async () => {
    await criarConta.executar(dadosValidos)

    await expect(criarConta.executar(dadosValidos)).rejects.toThrow(
      AutenticacaoError,
    )
  })
})
