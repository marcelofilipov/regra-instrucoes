import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore'
import type { IAuditoriaRepository } from '@/domain/repositories/IAuditoriaRepository'
import type { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'
import { AuditoriaMapper } from './mappers/AuditoriaMapper'

export const COLECAO_DE_AUDITORIA = 'auditoria'

/** Teto do operador `in` do Firestore; acima disso a consulta é recusada. */
const MAXIMO_POR_CONSULTA = 30

export class FirestoreAuditoriaRepository implements IAuditoriaRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async listarPorInstrucoes(
    instrucaoIds: readonly string[],
  ): Promise<RegistroDeAuditoria[]> {
    const lotes = await Promise.all(
      emLotes(instrucaoIds, MAXIMO_POR_CONSULTA).map((lote) =>
        this.consultarLote(lote),
      ),
    )
    return lotes.flat().sort(doMaisRecente)
  }

  async listarTodos(): Promise<RegistroDeAuditoria[]> {
    const snapshot = await getDocs(collection(this.db, COLECAO_DE_AUDITORIA))
    return snapshot.docs
      .map((d) => AuditoriaMapper.fromFirestore(d.id, d.data()))
      .sort(doMaisRecente)
  }

  private async consultarLote(
    instrucaoIds: readonly string[],
  ): Promise<RegistroDeAuditoria[]> {
    const consulta = query(
      collection(this.db, COLECAO_DE_AUDITORIA),
      where('instrucaoId', 'in', instrucaoIds),
    )
    const snapshot = await getDocs(consulta)
    return snapshot.docs.map((d) => AuditoriaMapper.fromFirestore(d.id, d.data()))
  }
}

/**
 * Ordena em memória em vez de `orderBy`: combinar `in` com `orderBy` exigiria
 * índice composto, e o volume aqui é de dezenas de linhas por membro.
 */
function doMaisRecente(a: RegistroDeAuditoria, b: RegistroDeAuditoria): number {
  return b.alteradoEm.getTime() - a.alteradoEm.getTime()
}

function emLotes<T>(itens: readonly T[], tamanho: number): T[][] {
  const lotes: T[][] = []
  for (let inicio = 0; inicio < itens.length; inicio += tamanho) {
    lotes.push(itens.slice(inicio, inicio + tamanho))
  }
  return lotes
}
