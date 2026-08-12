import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Trava as razões de contraste da paleta (Seção 7 do plano, que pede a
 * verificação explicitamente). Lê os tokens do próprio `index.css`, então
 * mudar um hex lá derruba este teste — que é o objetivo: o par dourado/marfim
 * reprovava e ninguém notou até a Fase 7.
 */

// Lido do disco, e não por import: o Vitest roda com `css: false`, então um
// `import '...?raw'` de CSS volta vazio.
const CSS = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

/** WCAG 2.1 — 1.4.3 (texto) e 1.4.11 (não-texto). */
const AA_TEXTO = 4.5
const AA_NAO_TEXTO = 3

function corDoTema(nome: string): string {
  const achado = CSS.match(new RegExp(`--color-${nome}:\\s*(#[0-9a-f]{6})`, 'i'))
  if (achado === null) throw new Error(`Token --color-${nome} não está no index.css`)
  return achado[1]
}

function canalLinear(valor: number): number {
  const normalizado = valor / 255
  return normalizado <= 0.03928
    ? normalizado / 12.92
    : Math.pow((normalizado + 0.055) / 1.055, 2.4)
}

function luminancia(hex: string): number {
  const inteiro = parseInt(hex.slice(1), 16)
  return (
    0.2126 * canalLinear((inteiro >> 16) & 255) +
    0.7152 * canalLinear((inteiro >> 8) & 255) +
    0.0722 * canalLinear(inteiro & 255)
  )
}

function contraste(frente: string, fundo: string): number {
  const a = luminancia(frente)
  const b = luminancia(fundo)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const marinho = corDoTema('marinho')
const dourado = corDoTema('dourado')
const marfim = corDoTema('marfim')
const ardosia = corDoTema('ardosia')
const pedra = corDoTema('pedra')
const BRANCO = '#ffffff'

describe('contraste da paleta (WCAG AA)', () => {
  it.each([
    ['marinho sobre marfim', marinho, marfim],
    ['marinho sobre branco (cartão)', marinho, BRANCO],
    ['ardosia sobre marfim', ardosia, marfim],
    ['pedra sobre marfim', pedra, marfim],
    ['pedra sobre branco (cartão)', pedra, BRANCO],
    ['marfim sobre marinho', marfim, marinho],
    ['marinho sobre dourado', marinho, dourado],
  ])('%s passa em texto normal', (_nome, frente, fundo) => {
    expect(contraste(frente, fundo)).toBeGreaterThanOrEqual(AA_TEXTO)
  })

  it('a borda de campo em pedra é perceptível sobre o cartão branco', () => {
    expect(contraste(pedra, BRANCO)).toBeGreaterThanOrEqual(AA_NAO_TEXTO)
  })

  it('o foco em marinho é perceptível sobre os dois fundos', () => {
    expect(contraste(marinho, marfim)).toBeGreaterThanOrEqual(AA_NAO_TEXTO)
    expect(contraste(marinho, BRANCO)).toBeGreaterThanOrEqual(AA_NAO_TEXTO)
  })

  it('o dourado continua reprovando como texto — por isso é só preenchimento', () => {
    expect(contraste(dourado, marfim)).toBeLessThan(AA_TEXTO)
    expect(contraste(dourado, BRANCO)).toBeLessThan(AA_TEXTO)
  })
})
