import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { Instrucao } from '@/domain/entities/Instrucao'
import { ordemDoGrau } from '@/domain/enums/Grau'

export interface DependenciasDeListagem {
  instrucoes: IInstrucaoRepository
}

/**
 * Histórico de um membro, na ordem em que a pessoa o percorreu: por grau da
 * progressão e, dentro do grau, pelo número da instrução. Leitura é liberada a
 * qualquer usuário autenticado, então não há checagem de papel aqui.
 */
export class ListarInstrucoesPorMembroUseCase {
  private readonly instrucoes: IInstrucaoRepository

  constructor(deps: DependenciasDeListagem) {
    this.instrucoes = deps.instrucoes
  }

  async executar(membroId: string): Promise<Instrucao[]> {
    const doMembro = await this.instrucoes.listarPorMembro(membroId)
    return [...doMembro].sort(compararPorGrauENumero)
  }
}

function compararPorGrauENumero(uma: Instrucao, outra: Instrucao): number {
  const diferencaDeGrau = ordemDoGrau(uma.grau) - ordemDoGrau(outra.grau)
  return diferencaDeGrau !== 0 ? diferencaDeGrau : uma.numero - outra.numero
}
