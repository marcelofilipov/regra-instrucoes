import { DomainError } from '@/domain/errors/DomainError'

/** Lança DomainError se o texto for vazio ou só espaços. */
export function garantirTextoPresente(valor: string, campo: string): void {
  if (valor.trim().length === 0) {
    throw new DomainError(`Campo obrigatório ausente: ${campo}.`)
  }
}
