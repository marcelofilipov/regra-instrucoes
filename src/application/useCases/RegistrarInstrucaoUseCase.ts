import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { IMembroRepository } from '@/domain/repositories/IMembroRepository'
import type { IGeradorDeId } from '@/domain/services/IGeradorDeId'
import type { Usuario } from '@/domain/entities/Usuario'
import type { Grau } from '@/domain/enums/Grau'
import { Instrucao } from '@/domain/entities/Instrucao'
import { podeRegistrar } from '@/domain/enums/Papel'
import { DomainError } from '@/domain/errors/DomainError'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

export interface DadosDeNovaInstrucao {
  membroId: string
  grau: Grau
  numero: number
  dataRecebimento: Date
}

export interface DependenciasDeRegistroDeInstrucao {
  instrucoes: IInstrucaoRepository
  membros: IMembroRepository
  geradorDeId: IGeradorDeId
  agora?: () => Date
}

/**
 * Registra uma instrução pela primeira vez.
 *
 * Metade da dupla trava da Seção 1: Editor **cadastra**, não corrige. Se a
 * instrução já existe, este caso de uso recusa — corrigir data é ato de Admin,
 * por `AlterarDataInstrucaoUseCase`. A garantia real está na Security Rule, que
 * dá `create` a editor/admin e `update` só a admin.
 */
export class RegistrarInstrucaoUseCase {
  private readonly instrucoes: IInstrucaoRepository
  private readonly membros: IMembroRepository
  private readonly geradorDeId: IGeradorDeId
  private readonly agora: () => Date

  constructor(deps: DependenciasDeRegistroDeInstrucao) {
    this.instrucoes = deps.instrucoes
    this.membros = deps.membros
    this.geradorDeId = deps.geradorDeId
    this.agora = deps.agora ?? (() => new Date())
  }

  async executar(
    autor: Usuario,
    dados: DadosDeNovaInstrucao,
  ): Promise<Instrucao> {
    if (!podeRegistrar(autor.papel)) {
      throw new PermissaoNegadaError('registrar instruções', autor.papel)
    }
    await this.garantirQueOMembroExiste(dados.membroId)
    await this.garantirQueAindaNaoFoiRegistrada(dados)

    const instrucao = Instrucao.registrar({
      id: this.geradorDeId.gerar(),
      membroId: dados.membroId,
      grau: dados.grau,
      numero: dados.numero,
      dataRecebimento: dados.dataRecebimento,
      registradoPor: autor.id,
      registradoEm: this.agora(),
    })
    await this.instrucoes.salvar(instrucao)
    return instrucao
  }

  private async garantirQueOMembroExiste(membroId: string): Promise<void> {
    const membro = await this.membros.buscarPorId(membroId)
    if (membro === null) {
      throw new DomainError(`Membro não encontrado: ${membroId}.`)
    }
  }

  private async garantirQueAindaNaoFoiRegistrada(
    dados: DadosDeNovaInstrucao,
  ): Promise<void> {
    const doMembro = await this.instrucoes.listarPorMembro(dados.membroId)
    const jaRegistrada = doMembro.some(
      (instrucao) =>
        instrucao.grau === dados.grau && instrucao.numero === dados.numero,
    )
    if (jaRegistrada) {
      throw new DomainError(
        `A instrução ${dados.numero} do grau ${dados.grau} já está registrada para este membro. Corrigir a data é ato do Admin.`,
      )
    }
  }
}
