import { describe, it, expect, beforeEach } from 'vitest'
import { AutenticarUsuarioUseCase } from './AutenticarUsuarioUseCase'
import { GarantirPerfilUseCase } from './GarantirPerfilUseCase'
import { ProvedorAutenticacaoFake } from '@/test/fakes/ProvedorAutenticacaoFake'
import { UsuarioRepositoryEmMemoria } from '@/test/fakes/UsuarioRepositoryEmMemoria'
import { AutenticacaoError } from '@/domain/errors/AutenticacaoError'
import { Papel } from '@/domain/enums/Papel'

let provedor: ProvedorAutenticacaoFake
let repositorio: UsuarioRepositoryEmMemoria
let autenticar: AutenticarUsuarioUseCase

beforeEach(() => {
  provedor = new ProvedorAutenticacaoFake()
  repositorio = new UsuarioRepositoryEmMemoria()
  autenticar = new AutenticarUsuarioUseCase(
    provedor,
    new GarantirPerfilUseCase(repositorio),
  )
  provedor.semear('marcelo@loja.test', 'senha-certa', 'uid-1', 'Marcelo')
})

describe('AutenticarUsuarioUseCase', () => {
  it('devolve o perfil com papel após credencial válida', async () => {
    const usuario = await autenticar.executar({
      email: 'marcelo@loja.test',
      senha: 'senha-certa',
    })

    expect(usuario.id).toBe('uid-1')
    expect(usuario.papel).toBe(Papel.LEITOR)
  })

  it('propaga a falha quando a senha está errada', async () => {
    await expect(
      autenticar.executar({
        email: 'marcelo@loja.test',
        senha: 'senha-errada',
      }),
    ).rejects.toThrow(AutenticacaoError)
  })

  it('não cria perfil quando a autenticação falha', async () => {
    await expect(
      autenticar.executar({ email: 'marcelo@loja.test', senha: 'errada' }),
    ).rejects.toThrow()

    expect(repositorio.salvos.size).toBe(0)
  })
})
