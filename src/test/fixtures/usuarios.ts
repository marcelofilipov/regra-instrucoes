import { Usuario } from '@/domain/entities/Usuario'
import { Papel } from '@/domain/enums/Papel'

/** Usuário pronto com o papel pedido — o eixo de quase todo teste de permissão. */
export function usuarioCom(papel: Papel, id = `uid-${papel}`): Usuario {
  return Usuario.restaurar({
    id,
    nome: `Usuário ${papel}`,
    email: `${papel}@loja.test`,
    papel,
    criadoEm: new Date('2026-01-01'),
  })
}

export const leitor = () => usuarioCom(Papel.LEITOR)
export const editor = () => usuarioCom(Papel.EDITOR)
export const admin = () => usuarioCom(Papel.ADMIN)
