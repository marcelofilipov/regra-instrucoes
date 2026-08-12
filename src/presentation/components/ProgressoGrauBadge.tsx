import type { ProgressoDoGrau } from '@/domain/services/progresso'
import { ROTULO_DO_GRAU } from '@/presentation/rotulos'

interface ProgressoGrauBadgeProps {
  progresso: ProgressoDoGrau
}

/**
 * Nomeia o grau e diz se o bloco fechou. Os números saíram daqui: quem os
 * carrega agora é o `MedidorDeProgresso` ao lado, e repetir "5 de 7" nos dois
 * lugares só competiria por atenção.
 *
 * "completo" vai escrito, não só no dourado do fundo: o estado não pode
 * depender de cor sozinha, ainda mais nesta, que é fraca contra o fundo claro.
 */
export function ProgressoGrauBadge({ progresso }: ProgressoGrauBadgeProps) {
  const estilo = progresso.completo
    ? 'bg-dourado text-marinho'
    : 'bg-marinho/10 text-marinho'

  return (
    <span
      className={`w-fit rounded-md px-3 py-1 text-sm font-medium ${estilo}`}
    >
      {ROTULO_DO_GRAU[progresso.grau]}
      {progresso.completo && ' · completo'}
    </span>
  )
}
