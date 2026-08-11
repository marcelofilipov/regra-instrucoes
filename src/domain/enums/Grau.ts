import { DomainError } from '@/domain/errors/DomainError'

/**
 * Graus da progressão. Modelados como objeto `as const` + union type em vez de
 * `enum` do TS: o projeto usa `erasableSyntaxOnly`, que proíbe `enum` (emite
 * código em runtime). O efeito é o mesmo — valores nomeados e tipo fechado.
 */
export const Grau = {
  APRENDIZ: 'aprendiz',
  COMPANHEIRO: 'companheiro',
  MESTRE: 'mestre',
} as const

export type Grau = (typeof Grau)[keyof typeof Grau]

/** Nº fixo de instruções por grau (Seção 1 do plano). Catálogo no código — YAGNI. */
const TOTAL_DE_INSTRUCOES: Record<Grau, number> = {
  [Grau.APRENDIZ]: 7,
  [Grau.COMPANHEIRO]: 5,
  [Grau.MESTRE]: 3,
}

/** Ordem canônica da progressão — fonte única para promoção e ordenação. */
const ORDEM_DOS_GRAUS: readonly Grau[] = [
  Grau.APRENDIZ,
  Grau.COMPANHEIRO,
  Grau.MESTRE,
]

export function isGrau(valor: unknown): valor is Grau {
  return (
    typeof valor === 'string' &&
    (Object.values(Grau) as string[]).includes(valor)
  )
}

export function totalDeInstrucoes(grau: Grau): number {
  return TOTAL_DE_INSTRUCOES[grau]
}

/** Posição na progressão (0 = aprendiz). Útil para ordenar histórico. */
export function ordemDoGrau(grau: Grau): number {
  return ORDEM_DOS_GRAUS.indexOf(grau)
}

/** `null` no último grau, que não tem promoção adiante. */
export function proximoGrau(grau: Grau): Grau | null {
  return ORDEM_DOS_GRAUS[ordemDoGrau(grau) + 1] ?? null
}

/** Só permite avançar exatamente um grau na ordem canônica. */
export function podePromover(de: Grau, para: Grau): boolean {
  return proximoGrau(de) === para
}

export function garantirNumeroDeInstrucaoValido(grau: Grau, numero: number): void {
  const total = totalDeInstrucoes(grau)
  const foraDoIntervalo = numero < 1 || numero > total
  if (!Number.isInteger(numero) || foraDoIntervalo) {
    throw new DomainError(
      `Número de instrução inválido para o grau ${grau}: ${numero}. Esperado inteiro entre 1 e ${total}.`,
    )
  }
}
