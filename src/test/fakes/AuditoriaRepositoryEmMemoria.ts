import type { IAuditoriaRepository } from '@/domain/repositories/IAuditoriaRepository'
import type { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'

export class AuditoriaRepositoryEmMemoria implements IAuditoriaRepository {
  readonly registrados: RegistroDeAuditoria[] = []

  /**
   * Fora da porta de propósito: no domínio, log só nasce junto da alteração.
   * Aqui existe porque é o fake de instruções que simula o `writeBatch`.
   */
  registrar(registro: RegistroDeAuditoria): void {
    this.registrados.push(registro)
  }

  async listarPorInstrucoes(
    instrucaoIds: readonly string[],
  ): Promise<RegistroDeAuditoria[]> {
    const procurados = new Set(instrucaoIds)
    return this.registrados
      .filter((registro) => procurados.has(registro.instrucaoId))
      .sort((a, b) => b.alteradoEm.getTime() - a.alteradoEm.getTime())
  }
}
