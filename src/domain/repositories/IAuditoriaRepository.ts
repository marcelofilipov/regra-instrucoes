import type { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'

/**
 * Porta de leitura da trilha de auditoria — e só de leitura, de propósito.
 *
 * Gravar log isolado não existe como operação: o log nasce grudado à alteração,
 * em `IInstrucaoRepository.salvarComAuditoria`. Sem método de escrita aqui, não
 * há como um caso de uso novo gravar a alteração e "esquecer" o log — que é o
 * risco nº 3 do plano, já que o Spark não tem trigger de banco para garantir o par.
 */
export interface IAuditoriaRepository {
  /**
   * Logs das instruções indicadas, do mais recente para o mais antigo.
   * Lista vazia devolve vazio sem ir ao banco.
   */
  listarPorInstrucoes(instrucaoIds: readonly string[]): Promise<RegistroDeAuditoria[]>
  /** Trilha inteira, do mais recente para o mais antigo. Usada na exportação. */
  listarTodos(): Promise<RegistroDeAuditoria[]>
}
