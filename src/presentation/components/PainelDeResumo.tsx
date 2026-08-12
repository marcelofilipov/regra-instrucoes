import type { ResumoDaLoja } from '@/domain/services/progresso'
import { CARTAO } from '@/presentation/estilos'

interface PainelDeResumoProps {
  resumo: ResumoDaLoja
}

/**
 * Linha de indicadores da Loja. São números-síntese, não gráfico: para um valor
 * único a leitura direta ganha de qualquer barra ou pizza.
 */
export function PainelDeResumo({ resumo }: PainelDeResumoProps) {
  return (
    <section
      aria-label="Resumo da Loja"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <Indicador rotulo="Obreiros" valor={String(resumo.obreiros)} />
      <Indicador
        rotulo="Blocos completos"
        valor={`${resumo.blocosCompletos} de ${resumo.obreiros}`}
      />
      <Indicador
        rotulo="Instruções registradas"
        valor={`${resumo.percentualConcluido}%`}
        detalhe={`${resumo.instrucoesRegistradas} de ${resumo.instrucoesPrevistas} no grau atual`}
      />
    </section>
  )
}

interface IndicadorProps {
  rotulo: string
  valor: string
  detalhe?: string
}

function Indicador({ rotulo, valor, detalhe }: IndicadorProps) {
  return (
    <div className={CARTAO}>
      <p className="text-sm text-pedra">{rotulo}</p>
      {/* Sem `tabular-nums`: em número grande e solto, a largura fixa de dígito
          abre buracos. Alinhamento vertical só importa em coluna. */}
      <p className="text-2xl font-semibold text-marinho">{valor}</p>
      {detalhe !== undefined && (
        <p className="text-xs text-pedra">{detalhe}</p>
      )}
    </div>
  )
}
