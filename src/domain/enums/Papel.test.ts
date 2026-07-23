import { describe, it, expect } from 'vitest'
import {
  Papel,
  isPapel,
  podeRegistrar,
  podeAlterar,
  podeExcluir,
  podeGerenciarPapeis,
} from './Papel'

describe('Papel — matriz de permissão', () => {
  it('reconhece papéis válidos', () => {
    expect(isPapel('admin')).toBe(true)
    expect(isPapel('convidado')).toBe(false)
  })

  it('registrar (criar): Editor e Admin sim, Leitor não', () => {
    expect(podeRegistrar(Papel.LEITOR)).toBe(false)
    expect(podeRegistrar(Papel.EDITOR)).toBe(true)
    expect(podeRegistrar(Papel.ADMIN)).toBe(true)
  })

  it('alterar data já gravada: só Admin', () => {
    expect(podeAlterar(Papel.LEITOR)).toBe(false)
    expect(podeAlterar(Papel.EDITOR)).toBe(false)
    expect(podeAlterar(Papel.ADMIN)).toBe(true)
  })

  it('excluir e gerenciar papéis: só Admin', () => {
    expect(podeExcluir(Papel.EDITOR)).toBe(false)
    expect(podeExcluir(Papel.ADMIN)).toBe(true)
    expect(podeGerenciarPapeis(Papel.EDITOR)).toBe(false)
    expect(podeGerenciarPapeis(Papel.ADMIN)).toBe(true)
  })
})
