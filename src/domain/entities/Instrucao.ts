import { garantirTextoPresente } from '@/domain/guards'
import {
  garantirNumeroDeInstrucaoValido,
  type Grau,
} from '@/domain/enums/Grau'

/** Forma de dados de uma instrução, alinhada à coleção `instrucoes` do Firestore. */
export interface InstrucaoProps {
  id: string
  membroId: string
  grau: Grau
  numero: number
  dataRecebimento: Date
  registradoPor: string
  registradoEm: Date
  alteradoPor: string | null
  alteradoEm: Date | null
}

/** Dados necessários para registrar uma instrução pela primeira vez. */
export interface DadosDeRegistro {
  id: string
  membroId: string
  grau: Grau
  numero: number
  dataRecebimento: Date
  registradoPor: string
  registradoEm: Date
}

/**
 * Uma instrução recebida por um membro em um grau. A trava "só Admin altera"
 * é garantida no caso de uso + Security Rule; a entidade apenas registra que a
 * alteração ocorreu (quem e quando), mantendo a trilha de auditoria.
 */
export class Instrucao {
  readonly id: string
  readonly membroId: string
  readonly grau: Grau
  readonly numero: number
  readonly dataRecebimento: Date
  readonly registradoPor: string
  readonly registradoEm: Date
  readonly alteradoPor: string | null
  readonly alteradoEm: Date | null

  private constructor(props: InstrucaoProps) {
    garantirNumeroDeInstrucaoValido(props.grau, props.numero)
    garantirTextoPresente(props.membroId, 'membroId')
    garantirTextoPresente(props.registradoPor, 'registradoPor')

    this.id = props.id
    this.membroId = props.membroId
    this.grau = props.grau
    this.numero = props.numero
    this.dataRecebimento = props.dataRecebimento
    this.registradoPor = props.registradoPor
    this.registradoEm = props.registradoEm
    this.alteradoPor = props.alteradoPor
    this.alteradoEm = props.alteradoEm
  }

  /** Cria uma instrução nova (1º registro), ainda sem alteração. */
  static registrar(dados: DadosDeRegistro): Instrucao {
    return new Instrucao({ ...dados, alteradoPor: null, alteradoEm: null })
  }

  /** Reconstrói a partir da persistência, revalidando invariantes. */
  static restaurar(props: InstrucaoProps): Instrucao {
    return new Instrucao(props)
  }

  get foiAlterada(): boolean {
    return this.alteradoPor !== null
  }

  /**
   * Devolve uma nova instrução com a data corrigida. Imutável de propósito:
   * o objeto original nunca muda; quem persiste decide o que gravar.
   */
  alterarData(novaData: Date, uidAdmin: string, quando: Date): Instrucao {
    garantirTextoPresente(uidAdmin, 'uidAdmin')
    return new Instrucao({
      ...this.paraProps(),
      dataRecebimento: novaData,
      alteradoPor: uidAdmin,
      alteradoEm: quando,
    })
  }

  private paraProps(): InstrucaoProps {
    return {
      id: this.id,
      membroId: this.membroId,
      grau: this.grau,
      numero: this.numero,
      dataRecebimento: this.dataRecebimento,
      registradoPor: this.registradoPor,
      registradoEm: this.registradoEm,
      alteradoPor: this.alteradoPor,
      alteradoEm: this.alteradoEm,
    }
  }
}
