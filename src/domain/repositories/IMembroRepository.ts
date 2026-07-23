import type { Membro } from '@/domain/entities/Membro'

/**
 * Porta de persistência de membros. O domínio define o contrato; a camada de
 * infraestrutura (Firestore) implementa. Permite testar casos de uso com mock,
 * sem tocar Firebase.
 */
export interface IMembroRepository {
  salvar(membro: Membro): Promise<void>
  buscarPorId(id: string): Promise<Membro | null>
  listar(): Promise<Membro[]>
  excluir(id: string): Promise<void>
}
