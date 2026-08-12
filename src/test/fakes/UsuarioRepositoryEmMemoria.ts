import type { IUsuarioRepository } from '@/domain/repositories/IUsuarioRepository'
import type { Usuario } from '@/domain/entities/Usuario'

/** Dublê da porta de persistência: casos de uso testados sem tocar Firestore. */
export class UsuarioRepositoryEmMemoria implements IUsuarioRepository {
  readonly salvos = new Map<string, Usuario>()

  async salvar(usuario: Usuario): Promise<void> {
    this.salvos.set(usuario.id, usuario)
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.salvos.get(id) ?? null
  }

  async listar(): Promise<Usuario[]> {
    return [...this.salvos.values()]
  }
}
