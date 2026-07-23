import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import { Instrucao } from '@/domain/entities/Instrucao'
import type { Grau } from '@/domain/enums/Grau'
import { InstrucaoMapper } from './mappers/InstrucaoMapper'

const COLECAO = 'instrucoes'

export class FirestoreInstrucaoRepository implements IInstrucaoRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async salvar(instrucao: Instrucao): Promise<void> {
    const ref = doc(this.db, COLECAO, instrucao.id)
    await setDoc(ref, InstrucaoMapper.toFirestore(instrucao))
  }

  async buscarPorId(id: string): Promise<Instrucao | null> {
    const snapshot = await getDoc(doc(this.db, COLECAO, id))
    if (!snapshot.exists()) return null
    return InstrucaoMapper.fromFirestore(snapshot.id, snapshot.data())
  }

  async listarPorMembro(membroId: string): Promise<Instrucao[]> {
    return this.consultar(where('membroId', '==', membroId))
  }

  async listarPorGrau(grau: Grau): Promise<Instrucao[]> {
    return this.consultar(where('grau', '==', grau))
  }

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLECAO, id))
  }

  private async consultar(
    filtro: ReturnType<typeof where>,
  ): Promise<Instrucao[]> {
    const consulta = query(collection(this.db, COLECAO), filtro)
    const snapshot = await getDocs(consulta)
    return snapshot.docs.map((d) =>
      InstrucaoMapper.fromFirestore(d.id, d.data()),
    )
  }
}
