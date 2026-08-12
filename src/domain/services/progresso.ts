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

/** Números-síntese da Loja inteira, para o topo do painel. */
export interface ResumoDaLoja {
  obreiros: number
  blocosCompletos: number
  instrucoesRegistradas: number
  instrucoesPrevistas: number
  /** 0 a 100, inteiro. Zero quando nada é previsto — nunca `NaN` na tela. */
  percentualConcluido: number
}

/**
 * Consolida o painel numa linha de indicadores.
 *
 * Recebe o progresso do grau ATUAL de cada obreiro — um item por obreiro, que é
 * o que o painel do dashboard já monta. Daí `obreiros` ser o tamanho da lista.
 */
export function calcularResumoDaLoja(
  progressoDeCadaObreiro: readonly ProgressoDoGrau[],
): ResumoDaLoja {
  const instrucoesRegistradas = somar(
    progressoDeCadaObreiro,
    (progresso) => progresso.registradas,
  )
  const instrucoesPrevistas = somar(
    progressoDeCadaObreiro,
    (progresso) => progresso.total,
  )

  return {
    obreiros: progressoDeCadaObreiro.length,
    blocosCompletos: progressoDeCadaObreiro.filter(
      (progresso) => progresso.completo,
    ).length,
    instrucoesRegistradas,
    instrucoesPrevistas,
    percentualConcluido:
      instrucoesPrevistas === 0
        ? 0
        : Math.round((instrucoesRegistradas / instrucoesPrevistas) * 100),
  }
}

function somar(
  progressos: readonly ProgressoDoGrau[],
  valorDe: (progresso: ProgressoDoGrau) => number,
): number {
  return progressos.reduce(
    (total, progresso) => total + valorDe(progresso),
    0,
  )
}

function numerosDoGrau(total: number): number[] {
  return Array.from({ length: total }, (_, indice) => indice + 1)
}
