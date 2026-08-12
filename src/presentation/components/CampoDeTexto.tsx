import { CAMPO, ROTULO } from '@/presentation/estilos'

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
      <label htmlFor={id} className={ROTULO}>
        {rotulo}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        autoComplete={autoComplete}
        required
        className={CAMPO}
      />
    </div>
  )
}
