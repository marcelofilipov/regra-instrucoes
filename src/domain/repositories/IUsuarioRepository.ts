import type { Usuario } from '@/domain/entities/Usuario'

/**
 * Porta de persistência de usuários (coleção `usuarios`, chaveada pelo uid do
 * Firebase Auth). Igual às demais portas: o domínio define, a infraestrutura
 * implementa, os casos de uso testam com fake.
 */
export interface IUsuarioRepository {
  salvar(usuario: Usuario): Promise<void>
  buscarPorId(id: string): Promise<Usuario | null>
  /** Base da exportação: sem os papéis, um backup não restaura quem é quem. */
  listar(): Promise<Usuario[]>
}
