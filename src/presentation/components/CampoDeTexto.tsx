interface CampoDeTextoProps {
  id: string
  rotulo: string
  tipo?: 'text' | 'email' | 'password'
  valor: string
  aoMudar(valor: string): void
  autoComplete?: string
}

export function CampoDeTexto({
  id,
  rotulo,
  tipo = 'text',
  valor,
  aoMudar,
  autoComplete,
}: CampoDeTextoProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-marinho">
        {rotulo}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        autoComplete={autoComplete}
        required
        className="rounded-md border border-pedra/40 bg-white px-3 py-2 text-ardosia outline-none focus:border-marinho focus:ring-2 focus:ring-dourado/50"
      />
    </div>
  )
}
