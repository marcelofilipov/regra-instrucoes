import type { Instrucao } from '@/domain/entities/Instrucao'
import type { Grau } from '@/domain/enums/Grau'

/**
 * Porta de persistência de instruções. `instrucoes` é coleção própria (não
 * subcoleção de membros) para permitir consultas globais por grau sem collection
 * group query — daí `listarPorGrau`.
 */
export interface IInstrucaoRepository {
  salvar(instrucao: Instrucao): Promise<void>
  buscarPorId(id: string): Promise<Instrucao | null>
  listarPorMembro(membroId: string): Promise<Instrucao[]>
  listarPorGrau(grau: Grau): Promise<Instrucao[]>
  /** Base do painel de progresso: uma leitura só em vez de uma por membro. */
  listarTodas(): Promise<Instrucao[]>
  excluir(id: string): Promise<void>
}
