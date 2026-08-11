import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import type { IUsuarioRepository } from '@/domain/repositories/IUsuarioRepository'
import { Usuario } from '@/domain/entities/Usuario'
import { UsuarioMapper } from './mappers/UsuarioMapper'

const COLECAO = 'usuarios'

export class FirestoreUsuarioRepository implements IUsuarioRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async salvar(usuario: Usuario): Promise<void> {
    const ref = doc(this.db, COLECAO, usuario.id)
    await setDoc(ref, UsuarioMapper.toFirestore(usuario))
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const snapshot = await getDoc(doc(this.db, COLECAO, id))
    if (!snapshot.exists()) return null
    return UsuarioMapper.fromFirestore(snapshot.id, snapshot.data())
  }
}
