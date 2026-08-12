import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { IGeradorDeId } from '@/domain/services/IGeradorDeId'
import type { Usuario } from '@/domain/entities/Usuario'
import type { Instrucao } from '@/domain/entities/Instrucao'
import { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'
import { podeAlterar } from '@/domain/enums/Papel'
import { DomainError } from '@/domain/errors/DomainError'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

export interface DadosDeAlteracaoDeData {
  instrucaoId: string
  novaData: Date
}

export interface DependenciasDeAlteracaoDeData {
  instrucoes: IInstrucaoRepository
  geradorDeId: IGeradorDeId
  agora?: () => Date
}

/**
 * Corrige a data de uma instrução já registrada — a operação mais sensível do
 * sistema. Só Admin, checado aqui **antes** de tocar o repositório, e de novo
 * na Security Rule (`update` em `instrucoes` exige papel admin).
 *
 * A instrução guarda quem alterou e quando; a trilha em `auditoria/` guarda o
 * valor de antes. As duas gravações saem juntas, num `writeBatch` só — este é o
 * único caminho para alterar uma instrução, e é o que sustenta a trilha, já que
 * o Spark não tem trigger de banco para garantir o par.
 */
export class AlterarDataInstrucaoUseCase {
  private readonly instrucoes: IInstrucaoRepository
  private readonly geradorDeId: IGeradorDeId
  private readonly agora: () => Date

  constructor(deps: DependenciasDeAlteracaoDeData) {
    this.instrucoes = deps.instrucoes
    this.geradorDeId = deps.geradorDeId
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

    const quando = this.agora()
    const corrigida = instrucao.alterarData(dados.novaData, autor.id, quando)
    const registro = RegistroDeAuditoria.daAlteracaoDeData({
      id: this.geradorDeId.gerar(),
      instrucaoId: instrucao.id,
      dataAnterior: instrucao.dataRecebimento,
      dataNova: dados.novaData,
      alteradoPor: autor.id,
      alteradoEm: quando,
    })

    await this.instrucoes.salvarComAuditoria(corrigida, registro)
    return corrigida
  }
}
