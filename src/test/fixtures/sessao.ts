import type { Sessao } from '@/presentation/auth/AuthContext'
import type { Usuario } from '@/domain/entities/Usuario'

/** Sessão pronta para renderizar tela protegida sem passar pelo login. */
export function sessaoFake(
  usuario: Usuario | null = null,
  sobrescreve: Partial<Sessao> = {},
): Sessao {
  return {
    usuario,
    carregando: false,
    erroDeSessao: null,
    entrar: async () => {},
    criarConta: async () => {},
    sair: async () => {},
    ...sobrescreve,
  }
}
