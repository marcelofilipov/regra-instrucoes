import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth'
import type {
  CancelarObservacao,
  Credencial,
  IProvedorAutenticacao,
} from '@/domain/auth/IProvedorAutenticacao'
import { AutenticacaoError } from '@/domain/errors/AutenticacaoError'

/** Códigos do Firebase Auth → mensagens que fazem sentido para quem usa o app. */
const MENSAGENS_POR_CODIGO: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-not-found': 'E-mail ou senha inválidos.',
  'auth/wrong-password': 'E-mail ou senha inválidos.',
  'auth/user-disabled': 'Esta conta está desativada. Procure o Admin da Loja.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
  'auth/weak-password': 'A senha precisa ter ao menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
  'auth/network-request-failed': 'Falha de rede. Verifique sua conexão.',
}

const MENSAGEM_PADRAO = 'Não foi possível concluir a autenticação.'

/**
 * Adaptador do Firebase Auth para a porta `IProvedorAutenticacao`. Todo o SDK
 * de autenticação fica confinado aqui: os casos de uso só veem `Credencial`.
 */
export class FirebaseAuthProvider implements IProvedorAutenticacao {
  private readonly auth: Auth

  constructor(auth: Auth) {
    this.auth = auth
  }

  async entrar(email: string, senha: string): Promise<Credencial> {
    try {
      const { user } = await signInWithEmailAndPassword(this.auth, email, senha)
      return this.paraCredencial(user)
    } catch (erro) {
      throw this.traduzir(erro)
    }
  }

  async criarConta(
    email: string,
    senha: string,
    nome: string,
  ): Promise<Credencial> {
    try {
      const { user } = await createUserWithEmailAndPassword(
        this.auth,
        email,
        senha,
      )
      await updateProfile(user, { displayName: nome })
      return { ...this.paraCredencial(user), nome }
    } catch (erro) {
      throw this.traduzir(erro)
    }
  }

  async sair(): Promise<void> {
    try {
      await signOut(this.auth)
    } catch (erro) {
      throw this.traduzir(erro)
    }
  }

  observarSessao(
    aoMudar: (credencial: Credencial | null) => void,
  ): CancelarObservacao {
    return onAuthStateChanged(this.auth, (user) => {
      aoMudar(user === null ? null : this.paraCredencial(user))
    })
  }

  private paraCredencial(user: User): Credencial {
    if (user.email === null) {
      throw new AutenticacaoError('Conta sem e-mail associado.')
    }
    return { uid: user.uid, email: user.email, nome: user.displayName }
  }

  private traduzir(erro: unknown): AutenticacaoError {
    if (erro instanceof AutenticacaoError) return erro

    const codigo = this.codigoDoErro(erro)
    const mensagem =
      (codigo !== null ? MENSAGENS_POR_CODIGO[codigo] : undefined) ??
      MENSAGEM_PADRAO
    return new AutenticacaoError(mensagem, codigo)
  }

  private codigoDoErro(erro: unknown): string | null {
    const temCodigo =
      typeof erro === 'object' &&
      erro !== null &&
      'code' in erro &&
      typeof (erro as { code: unknown }).code === 'string'
    return temCodigo ? (erro as { code: string }).code : null
  }
}
