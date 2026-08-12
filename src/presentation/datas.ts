/**
 * Conversões entre `Date` e o texto `YYYY-MM-DD` do `<input type="date">`.
 *
 * A hora é fixada ao meio-dia local de propósito: `new Date('2026-03-10')` é
 * interpretado como UTC e, em fusos negativos como o do Brasil, volta um dia.
 * Meio-dia local sobrevive a qualquer fuso sem trocar a data.
 */
const MEIO_DIA = 'T12:00:00'

export function deTextoParaData(texto: string): Date {
  return new Date(`${texto}${MEIO_DIA}`)
}

export function paraTextoDeInput(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR')
}

/** Auditoria precisa da hora: duas correções no mesmo dia têm de se distinguir. */
export function formatarDataHora(data: Date): string {
  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
