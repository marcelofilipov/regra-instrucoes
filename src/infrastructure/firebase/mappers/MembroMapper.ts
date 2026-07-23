import { type DocumentData } from 'firebase/firestore'
import { Membro } from '@/domain/entities/Membro'
import { isGrau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'
import { paraData, paraDataOuNulo } from './timestamp'

/**
 * Fronteira entre domínio e Firestore. O domínio não conhece `Timestamp`; toda
 * tradução mora aqui. `toFirestore` omite o `id` (ele é a chave do documento).
 */
export const MembroMapper = {
  toFirestore(membro: Membro): DocumentData {
    return {
      nome: membro.nome,
      grauAtual: membro.grauAtual,
      dataIniciacao: membro.dataIniciacao,
      ativo: membro.ativo,
      criadoEm: membro.criadoEm,
      atualizadoEm: membro.atualizadoEm,
    }
  },

  fromFirestore(id: string, data: DocumentData): Membro {
    if (!isGrau(data.grauAtual)) {
      throw new DomainError(`Grau inválido no membro ${id}: ${data.grauAtual}`)
    }
    return Membro.restaurar({
      id,
      nome: data.nome,
      grauAtual: data.grauAtual,
      dataIniciacao: paraDataOuNulo(data.dataIniciacao, `membro ${id}`),
      ativo: data.ativo,
      criadoEm: paraData(data.criadoEm, `membro ${id}`),
      atualizadoEm: paraData(data.atualizadoEm, `membro ${id}`),
    })
  },
}
