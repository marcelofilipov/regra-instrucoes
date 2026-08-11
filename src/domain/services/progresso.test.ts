import { describe, it, expect } from 'vitest'
import { calcularProgressoDoGrau, calcularProgressoDoMembro } from './progresso'
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
