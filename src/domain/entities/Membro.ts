import { DomainError } from '@/domain/errors/DomainError'
import { garantirTextoPresente } from '@/domain/guards'
import { podePromover, type Grau } from '@/domain/enums/Grau'

/** Forma de dados de um membro, alinhada à coleção `membros` do Firestore. */
export interface MembroProps {
  id: string
  nome: string
  grauAtual: Grau
  dataIniciacao: Date | null
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

/** Dados necessários para cadastrar um membro pela primeira vez. */
export interface DadosDeCadastro {
  id: string
  nome: string
  grauAtual: Grau
  dataIniciacao: Date | null
  quando: Date
}

/**
 * Um membro da Loja. O grau evolui ao longo do tempo (aprendiz → companheiro →
 * mestre); cada promoção abre um novo bloco de instruções. Operações que mudam
 * estado devolvem uma nova instância — a entidade é imutável.
 */
export class Membro {
  readonly id: string
  readonly nome: string
  readonly grauAtual: Grau
  readonly dataIniciacao: Date | null
  readonly ativo: boolean
  readonly criadoEm: Date
  readonly atualizadoEm: Date

  private constructor(props: MembroProps) {
    garantirTextoPresente(props.nome, 'nome')

    this.id = props.id
    this.nome = props.nome
    this.grauAtual = props.grauAtual
    this.dataIniciacao = props.dataIniciacao
    this.ativo = props.ativo
    this.criadoEm = props.criadoEm
    this.atualizadoEm = props.atualizadoEm
  }

  static cadastrar(dados: DadosDeCadastro): Membro {
    return new Membro({
      id: dados.id,
      nome: dados.nome,
      grauAtual: dados.grauAtual,
      dataIniciacao: dados.dataIniciacao,
      ativo: true,
      criadoEm: dados.quando,
      atualizadoEm: dados.quando,
    })
  }

  static restaurar(props: MembroProps): Membro {
    return new Membro(props)
  }

  /** Promove exatamente um grau na ordem canônica; recusa saltos e retrocessos. */
  promover(novoGrau: Grau, quando: Date): Membro {
    if (!podePromover(this.grauAtual, novoGrau)) {
      throw new DomainError(
        `Promoção inválida: de ${this.grauAtual} para ${novoGrau}. Só é permitido avançar um grau por vez.`,
      )
    }
    return this.comAlteracao({ grauAtual: novoGrau }, quando)
  }

  inativar(quando: Date): Membro {
    return this.comAlteracao({ ativo: false }, quando)
  }

  reativar(quando: Date): Membro {
    return this.comAlteracao({ ativo: true }, quando)
  }

  private comAlteracao(mudancas: Partial<MembroProps>, quando: Date): Membro {
    return new Membro({ ...this.paraProps(), ...mudancas, atualizadoEm: quando })
  }

  private paraProps(): MembroProps {
    return {
      id: this.id,
      nome: this.nome,
      grauAtual: this.grauAtual,
      dataIniciacao: this.dataIniciacao,
      ativo: this.ativo,
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
    }
  }
}
