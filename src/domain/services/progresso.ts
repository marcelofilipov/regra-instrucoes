import type { Instrucao } from '@/domain/entities/Instrucao'
import { grausAte, totalDeInstrucoes, type Grau } from '@/domain/enums/Grau'

/** Quanto do bloco de instruções de um grau o membro já cumpriu. */
export interface ProgressoDoGrau {
  grau: Grau
  registradas: number
  total: number
  completo: boolean
  /** Números que faltam — é o que o formulário de registro oferece. */
  numerosPendentes: number[]
}

export function calcularProgressoDoGrau(
  grau: Grau,
  instrucoes: readonly Instrucao[],
): ProgressoDoGrau {
  const total = totalDeInstrucoes(grau)
  const registrados = new Set(
    instrucoes
      .filter((instrucao) => instrucao.grau === grau)
      .map((instrucao) => instrucao.numero),
  )
  const numerosPendentes = numerosDoGrau(total).filter(
    (numero) => !registrados.has(numero),
  )

  return {
    grau,
    registradas: registrados.size,
    total,
    completo: numerosPendentes.length === 0,
    numerosPendentes,
  }
}

/**
 * Progresso de cada grau já percorrido pelo membro, do primeiro ao atual — o
 * histórico é por grau + membro, e um Mestre carrega os blocos anteriores.
 */
export function calcularProgressoDoMembro(
  grauAtual: Grau,
  instrucoes: readonly Instrucao[],
): ProgressoDoGrau[] {
  return grausAte(grauAtual).map((grau) =>
    calcularProgressoDoGrau(grau, instrucoes),
  )
}

function numerosDoGrau(total: number): number[] {
  return Array.from({ length: total }, (_, indice) => indice + 1)
}
