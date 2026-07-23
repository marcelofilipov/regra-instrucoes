import { type DocumentData } from 'firebase/firestore'
import { Instrucao } from '@/domain/entities/Instrucao'
import { isGrau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'
import { paraData, paraDataOuNulo } from './timestamp'

export const InstrucaoMapper = {
  toFirestore(instrucao: Instrucao): DocumentData {
    return {
      membroId: instrucao.membroId,
      grau: instrucao.grau,
      numero: instrucao.numero,
      dataRecebimento: instrucao.dataRecebimento,
      registradoPor: instrucao.registradoPor,
      registradoEm: instrucao.registradoEm,
      alteradoPor: instrucao.alteradoPor,
      alteradoEm: instrucao.alteradoEm,
    }
  },

  fromFirestore(id: string, data: DocumentData): Instrucao {
    if (!isGrau(data.grau)) {
      throw new DomainError(`Grau inválido na instrução ${id}: ${data.grau}`)
    }
    return Instrucao.restaurar({
      id,
      membroId: data.membroId,
      grau: data.grau,
      numero: data.numero,
      dataRecebimento: paraData(data.dataRecebimento, `instrução ${id}`),
      registradoPor: data.registradoPor,
      registradoEm: paraData(data.registradoEm, `instrução ${id}`),
      alteradoPor: data.alteradoPor ?? null,
      alteradoEm: paraDataOuNulo(data.alteradoEm, `instrução ${id}`),
    })
  },
}
