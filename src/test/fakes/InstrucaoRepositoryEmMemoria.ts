import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { Instrucao } from '@/domain/entities/Instrucao'
import type { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'
import type { Grau } from '@/domain/enums/Grau'
import type { AuditoriaRepositoryEmMemoria } from './AuditoriaRepositoryEmMemoria'

export class InstrucaoRepositoryEmMemoria implements IInstrucaoRepository {
  readonly salvos = new Map<string, Instrucao>()
  private readonly auditoria: AuditoriaRepositoryEmMemoria | null

  /**
   * Sem auditoria acoplada, `salvarComAuditoria` só descarta o log — serve aos
   * testes que não olham a trilha. Passando o fake de auditoria, os dois ficam
   * ligados e é possível provar que a gravação é mesmo em par.
   */
  constructor(auditoria: AuditoriaRepositoryEmMemoria | null = null) {
    this.auditoria = auditoria
  }

  async salvar(instrucao: Instrucao): Promise<void> {
    this.salvos.set(instrucao.id, instrucao)
  }

  async salvarComAuditoria(
    instrucao: Instrucao,
    registro: RegistroDeAuditoria,
  ): Promise<void> {
    this.salvos.set(instrucao.id, instrucao)
    this.auditoria?.registrar(registro)
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

  async listarTodas(): Promise<Instrucao[]> {
    return [...this.salvos.values()]
  }

  async excluir(id: string): Promise<void> {
    this.salvos.delete(id)
  }

  private filtrar(criterio: (instrucao: Instrucao) => boolean): Instrucao[] {
    return [...this.salvos.values()].filter(criterio)
  }
}
