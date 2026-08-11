import type { IGeradorDeId } from '@/domain/services/IGeradorDeId'

/** Ids de documento via `crypto.randomUUID` (disponível em todo browser atual). */
export class UuidGeradorDeId implements IGeradorDeId {
  gerar(): string {
    return crypto.randomUUID()
  }
}
