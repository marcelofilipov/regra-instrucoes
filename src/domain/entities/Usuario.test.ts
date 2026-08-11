import { describe, it, expect } from 'vitest'
import { Usuario, type DadosDeRegistro } from './Usuario'
import { Papel } from '@/domain/enums/Papel'
import { DomainError } from '@/domain/errors/DomainError'

function dadosValidos(sobrescreve: Partial<DadosDeRegistro> = {}): DadosDeRegistro {
  return {
    id: 'uid-1',
    nome: 'Marcelo Rodrigo',
    email: 'marcelo@loja.test',
    quando: new Date('2026-01-01'),
    ...sobrescreve,
  }
}

describe('Usuario', () => {
  describe('registrar', () => {
    it('nasce sempre com papel leitor', () => {
      const usuario = Usuario.registrar(dadosValidos())

      expect(usuario.papel).toBe(Papel.LEITOR)
    })

    it('recusa nome vazio', () => {
      expect(() => Usuario.registrar(dadosValidos({ nome: '  ' }))).toThrow(
        DomainError,
      )
    })

    it('recusa e-mail sem formato de e-mail', () => {
      expect(() =>
        Usuario.registrar(dadosValidos({ email: 'marcelo-arroba-loja' })),
      ).toThrow(DomainError)
    })
  })

  describe('comPapel', () => {
    it('devolve nova instância promovida, sem alterar a original', () => {
      const leitor = Usuario.registrar(dadosValidos())

      const admin = leitor.comPapel(Papel.ADMIN)

      expect(admin.papel).toBe(Papel.ADMIN)
      expect(leitor.papel).toBe(Papel.LEITOR)
    })

    it('preserva identidade e data de criação', () => {
      const leitor = Usuario.registrar(dadosValidos())

      const editor = leitor.comPapel(Papel.EDITOR)

      expect(editor.id).toBe(leitor.id)
      expect(editor.criadoEm).toEqual(leitor.criadoEm)
    })
  })
})
