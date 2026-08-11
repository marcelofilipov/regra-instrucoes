import { describe, it, expect } from 'vitest'
import { deTextoParaData, formatarData, paraTextoDeInput } from './datas'

describe('conversão de datas do formulário', () => {
  it('não desloca o dia ao converter texto do input (fuso do Brasil)', () => {
    const data = deTextoParaData('2026-03-10')

    expect(data.getDate()).toBe(10)
    expect(data.getMonth()).toBe(2)
    expect(data.getFullYear()).toBe(2026)
  })

  it('volta para o formato do input preservando o dia', () => {
    expect(paraTextoDeInput(deTextoParaData('2026-03-10'))).toBe('2026-03-10')
  })

  it('preenche mês e dia com zero à esquerda', () => {
    expect(paraTextoDeInput(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
  })

  it('formata para leitura em pt-BR', () => {
    expect(formatarData(deTextoParaData('2026-03-10'))).toBe('10/03/2026')
  })
})
