import { type DocumentData } from 'firebase/firestore'
import { Usuario } from '@/domain/entities/Usuario'
import { isPapel } from '@/domain/enums/Papel'
import { DomainError } from '@/domain/errors/DomainError'
import { paraData } from './timestamp'

/**
 * Fronteira entre domínio e Firestore para a coleção `usuarios`. O `id` é o uid
 * do Auth e vira a chave do documento, por isso não aparece no payload.
 */
export const UsuarioMapper = {
  toFirestore(usuario: Usuario): DocumentData {
    return {
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      criadoEm: usuario.criadoEm,
    }
  },

  fromFirestore(id: string, data: DocumentData): Usuario {
    if (!isPapel(data.papel)) {
      throw new DomainError(`Papel inválido no usuário ${id}: ${data.papel}`)
    }
    return Usuario.restaurar({
      id,
      nome: data.nome,
      email: data.email,
      papel: data.papel,
      criadoEm: paraData(data.criadoEm, `usuário ${id}`),
    })
  },
}
