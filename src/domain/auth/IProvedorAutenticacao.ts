/** Identidade devolvida pelo provedor de autenticação, antes do perfil de papel. */
export interface Credencial {
  uid: string
  email: string
  nome: string | null
}

export type CancelarObservacao = () => void

/**
 * Porta de autenticação. Isola o domínio do SDK do Firebase Auth: os casos de
 * uso falam de credencial e sessão, não de `UserCredential` nem de
 * `onAuthStateChanged`.
 */
export interface IProvedorAutenticacao {
  entrar(email: string, senha: string): Promise<Credencial>
  criarConta(email: string, senha: string, nome: string): Promise<Credencial>
  sair(): Promise<void>
  /** Notifica login, logout e a restauração de sessão ao abrir o app. */
  observarSessao(
    aoMudar: (credencial: Credencial | null) => void,
  ): CancelarObservacao
}
