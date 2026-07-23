import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import type { IMembroRepository } from '@/domain/repositories/IMembroRepository'
import { Membro } from '@/domain/entities/Membro'
import { MembroMapper } from './mappers/MembroMapper'

const COLECAO = 'membros'

export class FirestoreMembroRepository implements IMembroRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async salvar(membro: Membro): Promise<void> {
    const ref = doc(this.db, COLECAO, membro.id)
    await setDoc(ref, MembroMapper.toFirestore(membro))
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    const snapshot = await getDoc(doc(this.db, COLECAO, id))
    if (!snapshot.exists()) return null
    return MembroMapper.fromFirestore(snapshot.id, snapshot.data())
  }

  async listar(): Promise<Membro[]> {
    const snapshot = await getDocs(collection(this.db, COLECAO))
    return snapshot.docs.map((d) => MembroMapper.fromFirestore(d.id, d.data()))
  }

  async excluir(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLECAO, id))
  }
}
