import { Papel } from '@/domain/enums/Papel'
import { useAuth } from '@/presentation/hooks/useAuth'

const DESCRICAO_DO_PAPEL: Record<Papel, string> = {
  [Papel.LEITOR]: 'Pode visualizar membros e instruções.',
  [Papel.EDITOR]: 'Pode cadastrar membros e registrar instruções pela 1ª vez.',
  [Papel.ADMIN]: 'Pode alterar datas já registradas, excluir e gerenciar papéis.',
}

export function DashboardPage() {
  const { usuario, sair } = useAuth()
  if (usuario === null) return null

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-marinho">
            Controle de Instruções
          </h1>
          <p className="text-pedra">{usuario.nome}</p>
        </div>
        <button
          type="button"
          onClick={sair}
          className="rounded-md border border-pedra/40 px-3 py-1.5 text-sm text-marinho"
        >
          Sair
        </button>
      </header>

      <section className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm">
        <span className="w-fit rounded-md bg-dourado px-3 py-1 text-sm font-medium text-marinho">
          {usuario.papel}
        </span>
        <p className="text-sm text-pedra">{DESCRICAO_DO_PAPEL[usuario.papel]}</p>
      </section>

      <p className="text-sm text-pedra">
        Autenticação concluída (Fase 3). Cadastro de membros e registro de
        instruções chegam nas próximas fases.
      </p>
    </main>
  )
}
