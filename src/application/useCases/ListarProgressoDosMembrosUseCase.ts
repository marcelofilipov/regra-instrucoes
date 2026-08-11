import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { Membro } from '@/domain/entities/Membro'
import type { ProgressoDoGrau } from '@/domain/services/progresso'
import { calcularProgressoDoGrau } from '@/domain/services/progresso'
import type { ListarMembrosUseCase } from './ListarMembrosUseCase'

export interface ProgressoDoMembro {
  membro: Membro
  progressoAtual: ProgressoDoGrau
}

export interface DependenciasDoPainelDeProgresso {
  listarMembros: ListarMembrosUseCase
  instrucoes: IInstrucaoRepository
}

/**
 * Painel do dashboard: cada membro com o quanto já cumpriu do grau em que está.
 *
 * Lê as instruções de uma vez e distribui em memória, em vez de uma consulta
 * por membro — na cota do Spark isso é a diferença entre uma leitura e dezenas
 * a cada abertura de tela.
 */
export class ListarProgressoDosMembrosUseCase {
  private readonly listarMembros: ListarMembrosUseCase
  private readonly instrucoes: IInstrucaoRepository

  constructor(deps: DependenciasDoPainelDeProgresso) {
    this.listarMembros = deps.listarMembros
    this.instrucoes = deps.instrucoes
  }

  async executar(): Promise<ProgressoDoMembro[]> {
    const [membros, todasAsInstrucoes] = await Promise.all([
      this.listarMembros.executar(),
      this.instrucoes.listarTodas(),
    ])

    return membros.map((membro) => ({
      membro,
      progressoAtual: calcularProgressoDoGrau(
        membro.grauAtual,
        todasAsInstrucoes.filter(
          (instrucao) => instrucao.membroId === membro.id,
        ),
      ),
    }))
  }
}
