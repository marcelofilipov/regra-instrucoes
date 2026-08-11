import type { Papel } from '@/domain/enums/Papel'

/**
 * Ação recusada por falta de papel. É a metade "rápida" da dupla trava: o caso
 * de uso recusa antes de ir ao banco, dando erro imediato na UI. A metade que
 * de fato protege é a Security Rule — esta aqui roda no client e, sozinha, não
 * garante nada.
 */
export class PermissaoNegadaError extends Error {
  readonly papel: Papel
  readonly acao: string

  constructor(acao: string, papel: Papel) {
    super(`Seu papel (${papel}) não permite ${acao}.`)
    this.name = 'PermissaoNegadaError'
    this.acao = acao
    this.papel = papel
  }
}
