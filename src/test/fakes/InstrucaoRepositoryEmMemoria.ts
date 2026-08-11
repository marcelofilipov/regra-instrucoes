import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { Instrucao } from '@/domain/entities/Instrucao'
import type { Grau } from '@/domain/enums/Grau'

export class InstrucaoRepositoryEmMemoria implements IInstrucaoRepository {
  readonly salvos = new Map<string, Instrucao>()

  async salvar(instrucao: Instrucao): Promise<void> {
    this.salvos.set(instrucao.id, instrucao)
  }

  async buscarPorId(id: string): Promise<Instrucao | null> {
    return this.salvos.get(id) ?? null
  }

  async listarPorMembro(membroId: string): Promise<Instrucao[]> {
    return this.filtrar((instrucao) => instrucao.membroId === membroId)
  }

  async listarPorGrau(grau: Grau): Promise<Instrucao[]> {
    return this.filtrar((instrucao) => instrucao.grau === grau)
  }

  async excluir(id: string): Promise<void> {
    this.salvos.delete(id)
  }

  private filtrar(criterio: (instrucao: Instrucao) => boolean): Instrucao[] {
    return [...this.salvos.values()].filter(criterio)
  }
}
