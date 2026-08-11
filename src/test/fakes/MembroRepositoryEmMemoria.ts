import type { IMembroRepository } from '@/domain/repositories/IMembroRepository'
import type { Membro } from '@/domain/entities/Membro'

export class MembroRepositoryEmMemoria implements IMembroRepository {
  readonly salvos = new Map<string, Membro>()

  async salvar(membro: Membro): Promise<void> {
    this.salvos.set(membro.id, membro)
  }

  async buscarPorId(id: string): Promise<Membro | null> {
    return this.salvos.get(id) ?? null
  }

  async listar(): Promise<Membro[]> {
    return [...this.salvos.values()]
  }

  async excluir(id: string): Promise<void> {
    this.salvos.delete(id)
  }
}
