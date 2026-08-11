import type { Usuario } from '@/domain/entities/Usuario'

/**
 * Converte o usuário possivelmente nulo da sessão no usuário exigido por um
 * caso de uso. Só é chamado de dentro de rota protegida, então cair aqui é bug
 * de roteamento — e falhar alto é melhor que enviar `null` ao domínio.
 */
export function exigirUsuario(usuario: Usuario | null): Usuario {
  if (usuario === null) {
    throw new Error('Ação exige usuário autenticado.')
  }
  return usuario
}
