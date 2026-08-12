import { Link } from 'react-router-dom'
import { LINK } from '@/presentation/estilos'

export function SemPermissaoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center sm:p-6">
      <h1 className="text-2xl font-semibold text-marinho">Sem permissão</h1>
      <p className="text-pedra">
        Seu papel atual não dá acesso a esta área. Peça ao Admin da Loja para
        ajustar sua permissão.
      </p>
      <Link to="/" className={LINK}>
        Voltar ao início
      </Link>
    </main>
  )
}
