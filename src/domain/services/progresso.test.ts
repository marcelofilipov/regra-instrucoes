import { describe, it, expect } from 'vitest'
import {
  calcularProgressoDoGrau,
  calcularProgressoDoMembro,
  calcularResumoDaLoja,
} from './progresso'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'

function instrucao(grau: Grau, numero: number): Instrucao {
  return Instrucao.registrar({
    id: `${grau}-${numero}`,
    membroId: 'membro-1',
    grau,
    numero,
    dataRecebimento: new Date('2026-03-10'),
    registradoPor: 'uid-editor',
    registradoEm: new Date('2026-03-10'),
  })
}

describe('calcularProgressoDoGrau', () => {
  it('conta as registradas contra o total do grau', () => {
    const progresso = calcularProgressoDoGrau(Grau.APRENDIZ, [
      instrucao(Grau.APRENDIZ, 1),
      instrucao(Grau.APRENDIZ, 3),
    ])

    expect(progresso.registradas).toBe(2)
    expect(progresso.total).toBe(7)
    expect(progresso.completo).toBe(false)
  })

  it('lista os números que ainda faltam, em ordem', () => {
    const progresso = calcularProgressoDoGrau(Grau.MESTRE, [
      instrucao(Grau.MESTRE, 2),
    ])

    expect(progresso.numerosPendentes).toEqual([1, 3])
  })

  it('ignora instruções de outro grau', () => {
    const progresso = calcularProgressoDoGrau(Grau.COMPANHEIRO, [
      instrucao(Grau.APRENDIZ, 1),
    ])

    expect(progresso.registradas).toBe(0)
  })

  it('marca completo quando o bloco fecha', () => {
    const todas = [1, 2, 3].map((numero) => instrucao(Grau.MESTRE, numero))

    const progresso = calcularProgressoDoGrau(Grau.MESTRE, todas)

    expect(progresso.completo).toBe(true)
    expect(progresso.numerosPendentes).toEqual([])
  })
})

describe('calcularProgressoDoMembro', () => {
  it('devolve um bloco por grau já percorrido, do primeiro ao atual', () => {
    const progresso = calcularProgressoDoMembro(Grau.COMPANHEIRO, [
      instrucao(Grau.APRENDIZ, 1),
    ])

    expect(progresso.map((p) => p.grau)).toEqual([
      Grau.APRENDIZ,
      Grau.COMPANHEIRO,
    ])
  })

  it('aprendiz vê só o próprio bloco', () => {
    const progresso = calcularProgressoDoMembro(Grau.APRENDIZ, [])

    expect(progresso).toHaveLength(1)
    expect(progresso[0].registradas).toBe(0)
  })
})

describe('calcularResumoDaLoja', () => {
  it('soma registradas e previstas de todos os obreiros', () => {
    const aprendizComTres = calcularProgressoDoGrau(Grau.APRENDIZ, [
      instrucao(Grau.APRENDIZ, 1),
      instrucao(Grau.APRENDIZ, 2),
      instrucao(Grau.APRENDIZ, 3),
    ])
    const mestreZerado = calcularProgressoDoGrau(Grau.MESTRE, [])

    const resumo = calcularResumoDaLoja([aprendizComTres, mestreZerado])

    expect(resumo.obreiros).toBe(2)
    expect(resumo.instrucoesRegistradas).toBe(3)
    expect(resumo.instrucoesPrevistas).toBe(10) // 7 do aprendiz + 3 do mestre
    expect(resumo.percentualConcluido).toBe(30)
  })

  it('conta como bloco completo só quem fechou o grau', () => {
    const mestreCompleto = calcularProgressoDoGrau(Grau.MESTRE, [
      instrucao(Grau.MESTRE, 1),
      instrucao(Grau.MESTRE, 2),
      instrucao(Grau.MESTRE, 3),
    ])
    const aprendizPelaMetade = calcularProgressoDoGrau(Grau.APRENDIZ, [
      instrucao(Grau.APRENDIZ, 1),
    ])

    const resumo = calcularResumoDaLoja([mestreCompleto, aprendizPelaMetade])

    expect(resumo.blocosCompletos).toBe(1)
  })

  it('arredonda o percentual para inteiro', () => {
    // 1 de 3 = 33,33…%
    const resumo = calcularResumoDaLoja([
      calcularProgressoDoGrau(Grau.MESTRE, [instrucao(Grau.MESTRE, 1)]),
    ])

    expect(resumo.percentualConcluido).toBe(33)
  })

  it('Loja sem obreiro devolve zero, nunca NaN', () => {
    const resumo = calcularResumoDaLoja([])

    expect(resumo.obreiros).toBe(0)
    expect(resumo.percentualConcluido).toBe(0)
    expect(Number.isNaN(resumo.percentualConcluido)).toBe(false)
  })
})
