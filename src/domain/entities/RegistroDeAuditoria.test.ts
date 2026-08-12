import { describe, expect, it } from 'vitest'
import {
  CAMPO_DATA_RECEBIMENTO,
  RegistroDeAuditoria,
} from './RegistroDeAuditoria'
import { DomainError } from '@/domain/errors/DomainError'

const DATA_ANTERIOR = new Date(2026, 2, 10, 12)
const DATA_NOVA = new Date(2026, 2, 17, 12)
const ALTERADO_EM = new Date(2026, 7, 11, 9, 30)

function registroDaAlteracao(
  ajustes: Partial<Parameters<typeof RegistroDeAuditoria.daAlteracaoDeData>[0]> = {},
) {
  return RegistroDeAuditoria.daAlteracaoDeData({
    id: 'log-1',
    instrucaoId: 'i1',
    dataAnterior: DATA_ANTERIOR,
    dataNova: DATA_NOVA,
    alteradoPor: 'uid-admin',
    alteradoEm: ALTERADO_EM,
    ...ajustes,
  })
}

describe('RegistroDeAuditoria', () => {
  it('guarda os dois valores da correção de data, em ISO', () => {
    const registro = registroDaAlteracao()

    expect(registro.campoAlterado).toBe(CAMPO_DATA_RECEBIMENTO)
    expect(registro.valorAnterior).toBe(DATA_ANTERIOR.toISOString())
    expect(registro.valorNovo).toBe(DATA_NOVA.toISOString())
  })

  it('o ISO gravado volta a ser a mesma data', () => {
    const registro = registroDaAlteracao()

    expect(new Date(registro.valorAnterior)).toEqual(DATA_ANTERIOR)
    expect(new Date(registro.valorNovo)).toEqual(DATA_NOVA)
  })

  it('registra quem alterou e quando', () => {
    const registro = registroDaAlteracao()

    expect(registro.alteradoPor).toBe('uid-admin')
    expect(registro.alteradoEm).toEqual(ALTERADO_EM)
    expect(registro.ehAlteracaoDeData).toBe(true)
  })

  it('recusa log sem autor — trilha anônima não é trilha', () => {
    expect(() => registroDaAlteracao({ alteradoPor: '  ' })).toThrow(DomainError)
  })

  it('recusa log solto, sem instrução de origem', () => {
    expect(() => registroDaAlteracao({ instrucaoId: '' })).toThrow(DomainError)
  })

  it('restaura o que veio do banco', () => {
    const registro = RegistroDeAuditoria.restaurar({
      id: 'log-9',
      instrucaoId: 'i9',
      campoAlterado: 'outroCampo',
      valorAnterior: 'antes',
      valorNovo: 'depois',
      alteradoPor: 'uid-admin',
      alteradoEm: ALTERADO_EM,
    })

    expect(registro.ehAlteracaoDeData).toBe(false)
    expect(registro.valorNovo).toBe('depois')
  })
})
