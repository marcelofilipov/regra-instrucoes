/**
 * Falha de autenticação já traduzida para linguagem de usuário. A camada de
 * infraestrutura converte os códigos do Firebase Auth nesta exceção, para que a
 * UI nunca precise conhecer strings como `auth/invalid-credential`.
 */
export class AutenticacaoError extends Error {
  readonly codigoOriginal: string | null

  constructor(mensagem: string, codigoOriginal: string | null = null) {
    super(mensagem)
    this.name = 'AutenticacaoError'
    this.codigoOriginal = codigoOriginal
  }
}
