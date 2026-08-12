interface MedidorDeProgressoProps {
  registradas: number
  total: number
  /** O que está sendo medido, para quem chega por leitor de tela. */
  descricao: string
}

/**
 * Régua de progresso: uma razão contra um limite ("5 de 7"), não um gráfico.
 *
 * Marinho sozinho, do claro ao cheio. O dourado NÃO entra como preenchimento:
 * dá 2,36:1 contra a superfície, abaixo dos 3:1 que a WCAG 1.4.11 exige de
 * objeto gráfico — quem enxerga pouco não veria a barra. Quem sinaliza bloco
 * fechado é o badge, onde o dourado é fundo e o marinho vai por cima.
 *
 * O valor viaja sempre como texto ao lado, então nada aqui depende de cor.
 */
export function MedidorDeProgresso({
  registradas,
  total,
  descricao,
}: MedidorDeProgressoProps) {
  const preenchido = total === 0 ? 0 : (registradas / total) * 100

  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={descricao}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={registradas}
        aria-valuetext={`${registradas} de ${total} instruções`}
        className="h-2 w-full rounded-r-[4px] bg-marinho/15"
      >
        {/* Cresce da linha de base à esquerda: quadrado ali, arredondado na
            ponta que carrega o dado. */}
        <div
          className="h-full rounded-r-[4px] bg-marinho"
          style={{ width: `${preenchido}%` }}
        />
      </div>
      <span className="shrink-0 text-sm tabular-nums text-pedra">
        {registradas} de {total}
      </span>
    </div>
  )
}
