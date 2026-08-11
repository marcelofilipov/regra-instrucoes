import { describe, it, expect, beforeEach } from 'vitest'
import { GarantirPerfilUseCase } from './GarantirPerfilUseCase'
import { UsuarioRepositoryEmMemoria } from '@/test/fakes/UsuarioRepositoryEmMemoria'
import { Usuario } from '@/domain/entities/Usuario'
import { Papel } from '@/domain/enums/Papel'
import type { Credencial } from '@/domain/auth/IProvedorAutenticacao'

const AGORA = new Date('2026-08-11T12:00:00Z')

let repositorio: UsuarioRepositoryEmMemoria
let garantirPerfil: GarantirPerfilUseCase

function credencial(sobrescreve: Partial<Credencial> = {}): Credencial {
  return {
    uid: 'uid-1',
    email: 'marcelo@loja.test',
    nome: 'Marcelo Rodrigo',
    ...sobrescreve,
  }
}

beforeEach(() => {
  repositorio = new UsuarioRepositoryEmMemoria()
  garantirPerfil = new GarantirPerfilUseCase(repositorio, () => AGORA)
})

describe('GarantirPerfilUseCase', () => {
  it('cria o perfil como leitor no primeiro acesso', async () => {
    const perfil = await garantirPerfil.executar(credencial())

    expect(perfil.papel).toBe(Papel.LEITOR)
    expect(perfil.criadoEm).toEqual(AGORA)
    expect(repositorio.salvos.get('uid-1')).toBeDefined()
  })

  it('não rebaixa quem já tem papel — devolve o perfil gravado', async () => {
    const admin = Usuario.restaurar({
      id: 'uid-1',
      nome: 'Admin da Loja',
      email: 'admin@loja.test',
      papel: Papel.ADMIN,
      criadoEm: new Date('2026-01-01'),
    })
    await repositorio.salvar(admin)

    const perfil = await garantirPerfil.executar(credencial())

    expect(perfil.papel).toBe(Papel.ADMIN)
  })

  it('usa o trecho antes do @ quando a credencial não tem nome', async () => {
    const perfil = await garantirPerfil.executar(credencial({ nome: null }))

    expect(perfil.nome).toBe('marcelo')
  })
})
