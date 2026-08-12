import { type DocumentData } from 'firebase/firestore'
import { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'
import { paraData } from './timestamp'

/** Fronteira entre domínio e Firestore para a coleção `auditoria`. */
export const AuditoriaMapper = {
  toFirestore(registro: RegistroDeAuditoria): DocumentData {
    return {
      instrucaoId: registro.instrucaoId,
      campoAlterado: registro.campoAlterado,
      valorAnterior: registro.valorAnterior,
      valorNovo: registro.valorNovo,
      alteradoPor: registro.alteradoPor,
      alteradoEm: registro.alteradoEm,
    }
  },

  fromFirestore(id: string, data: DocumentData): RegistroDeAuditoria {
    return RegistroDeAuditoria.restaurar({
      id,
      instrucaoId: data.instrucaoId,
      campoAlterado: data.campoAlterado,
      valorAnterior: data.valorAnterior,
      valorNovo: data.valorNovo,
      alteradoPor: data.alteradoPor,
      alteradoEm: paraData(data.alteradoEm, `auditoria ${id}`),
    })
  },
}
