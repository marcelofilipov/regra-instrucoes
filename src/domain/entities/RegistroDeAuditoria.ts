import { garantirTextoPresente } from '@/domain/guards'

/** Único campo auditado hoje. Nomeado porque vai gravado no banco e é consultado. */
export const CAMPO_DATA_RECEBIMENTO = 'dataRecebimento'

/** Forma de dados de um log, alinhada à coleção `auditoria` do Firestore. */
export interface RegistroDeAuditoriaProps {
  id: string
  instrucaoId: string
  campoAlterado: string
  valorAnterior: string
  valorNovo: string
  alteradoPor: string
  alteradoEm: Date
}

export interface DadosDaAlteracaoDeData {
  id: string
  instrucaoId: string
  dataAnterior: Date
  dataNova: Date
  alteradoPor: string
  alteradoEm: Date
}

/**
 * Uma linha da trilha de auditoria: o que mudou, de quanto para quanto, por quem
 * e quando. Imutável, como manda a rule (`auditoria` é append-only: nem update
 * nem delete, para ninguém).
 *
 * Valores vão como texto ISO 8601 — sem fuso ambíguo e legível direto no banco,
 * que é onde alguém vai olhar quando precisar conferir uma correção.
 */
export class RegistroDeAuditoria {
  readonly id: string
  readonly instrucaoId: string
  readonly campoAlterado: string
  readonly valorAnterior: string
  readonly valorNovo: string
  readonly alteradoPor: string
  readonly alteradoEm: Date

  private constructor(props: RegistroDeAuditoriaProps) {
    garantirTextoPresente(props.instrucaoId, 'instrucaoId')
    garantirTextoPresente(props.campoAlterado, 'campoAlterado')
    garantirTextoPresente(props.alteradoPor, 'alteradoPor')

    this.id = props.id
    this.instrucaoId = props.instrucaoId
    this.campoAlterado = props.campoAlterado
    this.valorAnterior = props.valorAnterior
    this.valorNovo = props.valorNovo
    this.alteradoPor = props.alteradoPor
    this.alteradoEm = props.alteradoEm
  }

  /** Correção de data de instrução — a única operação auditada até aqui. */
  static daAlteracaoDeData(
    dados: DadosDaAlteracaoDeData,
  ): RegistroDeAuditoria {
    return new RegistroDeAuditoria({
      id: dados.id,
      instrucaoId: dados.instrucaoId,
      campoAlterado: CAMPO_DATA_RECEBIMENTO,
      valorAnterior: dados.dataAnterior.toISOString(),
      valorNovo: dados.dataNova.toISOString(),
      alteradoPor: dados.alteradoPor,
      alteradoEm: dados.alteradoEm,
    })
  }

  static restaurar(props: RegistroDeAuditoriaProps): RegistroDeAuditoria {
    return new RegistroDeAuditoria(props)
  }

  get ehAlteracaoDeData(): boolean {
    return this.campoAlterado === CAMPO_DATA_RECEBIMENTO
  }
}
