import { DomainError } from '@/domain/errors/DomainError'

/** Lança DomainError se o texto for vazio ou só espaços. */
export function garantirTextoPresente(valor: string, campo: string): void {
  if (valor.trim().length === 0) {
    throw new DomainError(`Campo obrigatório ausente: ${campo}.`)
  }
}

// Validação deliberadamente frouxa: quem valida e-mail de verdade é o provedor
// de autenticação. Aqui só barramos o que é obviamente inválido.
const FORMATO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function garantirEmailValido(valor: string): void {
  garantirTextoPresente(valor, 'email')
  if (!FORMATO_DE_EMAIL.test(valor)) {
    throw new DomainError(`E-mail inválido: ${valor}.`)
  }
}
