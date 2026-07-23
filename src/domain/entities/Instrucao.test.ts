import { describe, it, expect } from 'vitest'
import { Instrucao, type DadosDeRegistro } from './Instrucao'
import { Grau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'

function dadosValidos(sobrescreve: Partial<DadosDeRegistro> = {}): DadosDeRegistro {
  return {
    id: 'instr-1',
    membroId: 'membro-1',
    grau: Grau.APRENDIZ,
    numero: 1,
    dataRecebimento: new Date('2026-01-10'),
    registradoPor: 'uid-editor',
    registradoEm: new Date('2026-01-10'),
    ...sobrescreve,
  }
}

describe('Instrucao', () => {
  describe('registrar', () => {
    it('cria uma instrução válida sem marca de alteração', () => {
      const instrucao = Instrucao.registrar(dadosValidos())

      expect(instrucao.numero).toBe(1)
      expect(instrucao.foiAlterada).toBe(false)
      expect(instrucao.alteradoPor).toBeNull()
    })

    it('recusa número fora do intervalo do grau', () => {
      expect(() =>
        Instrucao.registrar(dadosValidos({ grau: Grau.MESTRE, numero: 4 })),
      ).toThrow(DomainError)
    })

    it('recusa membroId e registradoPor vazios', () => {
      expect(() => Instrucao.registrar(dadosValidos({ membroId: '  ' }))).toThrow(
        DomainError,
      )
      expect(() =>
        Instrucao.registrar(dadosValidos({ registradoPor: '' })),
      ).toThrow(DomainError)
    })
  })

  describe('alterarData', () => {
    it('devolve nova instrução com data e trilha de alteração preenchidas', () => {
      const original = Instrucao.registrar(dadosValidos())
      const novaData = new Date('2026-02-01')
      const quando = new Date('2026-02-05')

      const alterada = original.alterarData(novaData, 'uid-admin', quando)

      expect(alterada.dataRecebimento).toBe(novaData)
      expect(alterada.alteradoPor).toBe('uid-admin')
      expect(alterada.alteradoEm).toBe(quando)
      expect(alterada.foiAlterada).toBe(true)
    })

    it('não muta a instrução original (imutabilidade)', () => {
      const original = Instrucao.registrar(dadosValidos())

      original.alterarData(new Date('2026-02-01'), 'uid-admin', new Date())

      expect(original.foiAlterada).toBe(false)
    })

    it('exige o uid do admin', () => {
      const original = Instrucao.registrar(dadosValidos())

      expect(() =>
        original.alterarData(new Date(), '', new Date()),
      ).toThrow(DomainError)
    })
  })
})
