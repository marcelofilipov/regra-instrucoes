import type {
  CancelarObservacao,
  Credencial,
  IProvedorAutenticacao,
} from '@/domain/auth/IProvedorAutenticacao'
import { AutenticacaoError } from '@/domain/errors/AutenticacaoError'

interface ContaFake {
  uid: string
  senha: string
  nome: string | null
}

/**
 * Dublê do Firebase Auth com o comportamento que os casos de uso dependem:
 * credencial válida, credencial recusada e notificação de sessão.
 */
export class ProvedorAutenticacaoFake implements IProvedorAutenticacao {
  private readonly contas = new Map<string, ContaFake>()
  private observador: ((credencial: Credencial | null) => void) | null = null

  /** Semeia uma conta já existente no provedor (cenário de login). */
  semear(email: string, senha: string, uid: string, nome: string | null = null): void {
    this.contas.set(email, { uid, senha, nome })
  }

  async entrar(email: string, senha: string): Promise<Credencial> {
    const conta = this.contas.get(email)
    if (conta === undefined || conta.senha !== senha) {
      throw new AutenticacaoError('E-mail ou senha inválidos.')
    }
    return this.notificar({ uid: conta.uid, email, nome: conta.nome })
  }

  async criarConta(
    email: string,
    senha: string,
    nome: string,
  ): Promise<Credencial> {
    if (this.contas.has(email)) {
      throw new AutenticacaoError('Já existe uma conta com este e-mail.')
    }
    const uid = `uid-${this.contas.size + 1}`
    this.contas.set(email, { uid, senha, nome })
    return this.notificar({ uid, email, nome })
  }

  async sair(): Promise<void> {
    this.observador?.(null)
  }

  observarSessao(
    aoMudar: (credencial: Credencial | null) => void,
  ): CancelarObservacao {
    this.observador = aoMudar
    aoMudar(null)
    return () => {
      this.observador = null
    }
  }

  private notificar(credencial: Credencial): Credencial {
    this.observador?.(credencial)
    return credencial
  }
}
