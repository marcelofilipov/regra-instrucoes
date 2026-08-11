import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { Usuario } from '@/domain/entities/Usuario'
import type { Instrucao } from '@/domain/entities/Instrucao'
import { podeAlterar } from '@/domain/enums/Papel'
import { DomainError } from '@/domain/errors/DomainError'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

export interface DadosDeAlteracaoDeData {
  instrucaoId: string
  novaData: Date
}

export interface DependenciasDeAlteracaoDeData {
  instrucoes: IInstrucaoRepository
  agora?: () => Date
}

/**
 * Corrige a data de uma instrução já registrada — a operação mais sensível do
 * sistema. Só Admin, checado aqui **antes** de tocar o repositório, e de novo
 * na Security Rule (`update` em `instrucoes` exige papel admin).
 *
 * A instrução guarda quem alterou e quando. A trilha em `auditoria/` entra na
 * Fase 6, no mesmo `writeBatch()` desta gravação.
 */
export class AlterarDataInstrucaoUseCase {
  private readonly instrucoes: IInstrucaoRepository
  private readonly agora: () => Date

  constructor(deps: DependenciasDeAlteracaoDeData) {
    this.instrucoes = deps.instrucoes
    this.agora = deps.agora ?? (() => new Date())
  }

  async executar(
    autor: Usuario,
    dados: DadosDeAlteracaoDeData,
  ): Promise<Instrucao> {
    if (!podeAlterar(autor.papel)) {
      throw new PermissaoNegadaError(
        'alterar uma data já registrada',
        autor.papel,
      )
    }

    const instrucao = await this.instrucoes.buscarPorId(dados.instrucaoId)
    if (instrucao === null) {
      throw new DomainError(`Instrução não encontrada: ${dados.instrucaoId}.`)
    }

    const corrigida = instrucao.alterarData(
      dados.novaData,
      autor.id,
      this.agora(),
    )
    await this.instrucoes.salvar(corrigida)
    return corrigida
  }
}
