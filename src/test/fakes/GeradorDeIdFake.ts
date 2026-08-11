import type { IGeradorDeId } from '@/domain/services/IGeradorDeId'

/** Ids previsíveis (`id-1`, `id-2`, …) para os testes poderem afirmar sobre eles. */
export class GeradorDeIdFake implements IGeradorDeId {
  private contador = 0

  gerar(): string {
    this.contador += 1
    return `id-${this.contador}`
  }
}
