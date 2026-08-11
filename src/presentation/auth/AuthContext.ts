import { createContext } from 'react'
import type { Usuario } from '@/domain/entities/Usuario'
import type { DadosDeLogin } from '@/application/useCases/AutenticarUsuarioUseCase'
import type { DadosDeNovaConta } from '@/application/useCases/CriarContaUseCase'

/**
 * Sessão corrente. O papel do usuário fica cacheado aqui após o login, em vez
 * de cada tela reconsultar `usuarios/{uid}` no Firestore (Seção 4 do plano).
 */
export interface Sessao {
  usuario: Usuario | null
  carregando: boolean
  erroDeSessao: string | null
  entrar(dados: DadosDeLogin): Promise<void>
  criarConta(dados: DadosDeNovaConta): Promise<void>
  sair(): Promise<void>
}

export const AuthContext = createContext<Sessao | null>(null)
