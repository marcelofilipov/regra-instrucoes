import { describe, it, expect } from 'vitest'
import {
  Grau,
  isGrau,
  totalDeInstrucoes,
  proximoGrau,
  podePromover,
  garantirNumeroDeInstrucaoValido,
} from './Grau'
import { DomainError } from '@/domain/errors/DomainError'

describe('Grau', () => {
  it('mapeia cada grau ao seu total fixo de instruções', () => {
    expect(totalDeInstrucoes(Grau.APRENDIZ)).toBe(7)
    expect(totalDeInstrucoes(Grau.COMPANHEIRO)).toBe(5)
    expect(totalDeInstrucoes(Grau.MESTRE)).toBe(3)
  })

  it('reconhece valores válidos e rejeita inválidos com isGrau', () => {
    expect(isGrau('aprendiz')).toBe(true)
    expect(isGrau('venerável')).toBe(false)
    expect(isGrau(42)).toBe(false)
  })

  describe('progressão de grau', () => {
    it('avança na ordem canônica aprendiz → companheiro → mestre', () => {
      expect(proximoGrau(Grau.APRENDIZ)).toBe(Grau.COMPANHEIRO)
      expect(proximoGrau(Grau.COMPANHEIRO)).toBe(Grau.MESTRE)
    })

    it('não tem grau seguinte após mestre', () => {
      expect(proximoGrau(Grau.MESTRE)).toBeNull()
    })

    it('permite promover apenas um grau adiante', () => {
      expect(podePromover(Grau.APRENDIZ, Grau.COMPANHEIRO)).toBe(true)
      expect(podePromover(Grau.APRENDIZ, Grau.MESTRE)).toBe(false)
      expect(podePromover(Grau.COMPANHEIRO, Grau.APRENDIZ)).toBe(false)
    })
  })

  describe('garantirNumeroDeInstrucaoValido', () => {
    it('aceita números dentro do intervalo do grau', () => {
      expect(() => garantirNumeroDeInstrucaoValido(Grau.APRENDIZ, 1)).not.toThrow()
      expect(() => garantirNumeroDeInstrucaoValido(Grau.APRENDIZ, 7)).not.toThrow()
    })

    it('rejeita número acima do total do grau', () => {
      expect(() => garantirNumeroDeInstrucaoValido(Grau.MESTRE, 4)).toThrow(
        DomainError,
      )
    })

    it('rejeita zero, negativo e não-inteiro', () => {
      expect(() => garantirNumeroDeInstrucaoValido(Grau.APRENDIZ, 0)).toThrow(
        DomainError,
      )
      expect(() => garantirNumeroDeInstrucaoValido(Grau.APRENDIZ, -1)).toThrow(
        DomainError,
      )
      expect(() => garantirNumeroDeInstrucaoValido(Grau.APRENDIZ, 2.5)).toThrow(
        DomainError,
      )
    })
  })
})
