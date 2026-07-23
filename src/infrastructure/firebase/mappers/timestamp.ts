import { Timestamp } from 'firebase/firestore'
import { DomainError } from '@/domain/errors/DomainError'

/** Timestamp | null do Firestore → Date | null do domínio. */
export function paraDataOuNulo(valor: unknown, contexto: string): Date | null {
  if (valor === null || valor === undefined) return null
  if (valor instanceof Timestamp) return valor.toDate()
  throw new DomainError(`Campo de data inválido ao ler ${contexto} do Firestore.`)
}

/** Igual a paraDataOuNulo, mas exige a data presente. */
export function paraData(valor: unknown, contexto: string): Date {
  const data = paraDataOuNulo(valor, contexto)
  if (data === null) {
    throw new DomainError(`Data obrigatória ausente em ${contexto}.`)
  }
  return data
}
