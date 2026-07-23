import { describe, it, expect } from 'vitest'
import { Membro, type DadosDeCadastro } from './Membro'
import { Grau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'

function dadosValidos(sobrescreve: Partial<DadosDeCadastro> = {}): DadosDeCadastro {
  return {
    id: 'membro-1',
    nome: 'Marcelo Rodrigo',
    grauAtual: Grau.APRENDIZ,
    dataIniciacao: new Date('2026-01-01'),
    quando: new Date('2026-01-01'),
    ...sobrescreve,
  }
}

describe('Membro', () => {
  describe('cadastrar', () => {
    it('cria um membro ativo com os dados informados', () => {
      const membro = Membro.cadastrar(dadosValidos())

      expect(membro.nome).toBe('Marcelo Rodrigo')
      expect(membro.grauAtual).toBe(Grau.APRENDIZ)
      expect(membro.ativo).toBe(true)
    })

    it('recusa nome vazio', () => {
      expect(() => Membro.cadastrar(dadosValidos({ nome: '   ' }))).toThrow(
        DomainError,
      )
    })
  })

  describe('promover', () => {
    it('avança um grau na ordem canônica e atualiza a data', () => {
      const membro = Membro.cadastrar(dadosValidos())
      const quando = new Date('2027-01-01')

      const promovido = membro.promover(Grau.COMPANHEIRO, quando)

      expect(promovido.grauAtual).toBe(Grau.COMPANHEIRO)
      expect(promovido.atualizadoEm).toBe(quando)
    })

    it('recusa salto de grau (aprendiz → mestre)', () => {
      const membro = Membro.cadastrar(dadosValidos())

      expect(() => membro.promover(Grau.MESTRE, new Date())).toThrow(DomainError)
    })

    it('não muta o membro original', () => {
      const membro = Membro.cadastrar(dadosValidos())

      membro.promover(Grau.COMPANHEIRO, new Date())

      expect(membro.grauAtual).toBe(Grau.APRENDIZ)
    })
  })

  describe('inativar/reativar', () => {
    it('alterna o status ativo', () => {
      const membro = Membro.cadastrar(dadosValidos())

      expect(membro.inativar(new Date()).ativo).toBe(false)
      expect(membro.inativar(new Date()).reativar(new Date()).ativo).toBe(true)
    })
  })
})
