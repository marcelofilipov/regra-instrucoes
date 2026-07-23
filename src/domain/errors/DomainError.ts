/**
 * Erro de regra de negócio. Distinto de erros técnicos (rede, Firestore) para
 * que as camadas superiores possam tratar violação de invariante de forma
 * diferente de falha de infraestrutura.
 */
export class DomainError extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'DomainError'
  }
}
