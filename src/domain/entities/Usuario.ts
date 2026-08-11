import { garantirEmailValido, garantirTextoPresente } from '@/domain/guards'
import { Papel } from '@/domain/enums/Papel'

/** Forma de dados de um usuário, alinhada à coleção `usuarios` do Firestore. */
export interface UsuarioProps {
  id: string // uid do Firebase Auth — é a chave do documento
  nome: string
  email: string
  papel: Papel
  criadoEm: Date
}

/** Dados disponíveis no primeiro acesso, vindos do provedor de autenticação. */
export interface DadosDeRegistro {
  id: string
  nome: string
  email: string
  quando: Date
}

/**
 * Um usuário do sistema. O papel define o que ele pode fazer (Seção 2 do plano).
 *
 * Invariante central: todo usuário nasce `leitor`. A promoção é ato de um Admin,
 * nunca do próprio usuário — a mesma trava existe na Security Rule de
 * `usuarios/{uid}`, que é onde ela de fato vale (client não é confiável).
 */
export class Usuario {
  readonly id: string
  readonly nome: string
  readonly email: string
  readonly papel: Papel
  readonly criadoEm: Date

  private constructor(props: UsuarioProps) {
    garantirTextoPresente(props.nome, 'nome')
    garantirEmailValido(props.email)

    this.id = props.id
    this.nome = props.nome
    this.email = props.email
    this.papel = props.papel
    this.criadoEm = props.criadoEm
  }

  static registrar(dados: DadosDeRegistro): Usuario {
    return new Usuario({
      id: dados.id,
      nome: dados.nome,
      email: dados.email,
      papel: Papel.LEITOR,
      criadoEm: dados.quando,
    })
  }

  static restaurar(props: UsuarioProps): Usuario {
    return new Usuario(props)
  }

  /** Devolve uma nova instância com outro papel; a entidade é imutável. */
  comPapel(novoPapel: Papel): Usuario {
    return new Usuario({
      id: this.id,
      nome: this.nome,
      email: this.email,
      papel: novoPapel,
      criadoEm: this.criadoEm,
    })
  }
}
