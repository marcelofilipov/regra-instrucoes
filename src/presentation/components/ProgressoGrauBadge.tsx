import type { ProgressoDoGrau } from '@/domain/services/progresso'
import { ROTULO_DO_GRAU } from '@/presentation/rotulos'

interface ProgressoGrauBadgeProps {
  progresso: ProgressoDoGrau
}

/** Ex.: "Aprendiz — 5 de 7 instruções". Dourado quando o bloco fecha. */
export function ProgressoGrauBadge({ progresso }: ProgressoGrauBadgeProps) {
  const estilo = progresso.completo
    ? 'bg-dourado text-marinho'
    : 'bg-marinho/10 text-marinho'

  return (
    <span
      className={`w-fit rounded-md px-3 py-1 text-sm font-medium ${estilo}`}
    >
      {ROTULO_DO_GRAU[progresso.grau]} — {progresso.registradas} de{' '}
      {progresso.total} instruções
    </span>
  )
}
