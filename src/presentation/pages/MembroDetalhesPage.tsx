import { Link, useParams } from 'react-router-dom'
import type { Membro } from '@/domain/entities/Membro'
import type { Instrucao } from '@/domain/entities/Instrucao'
import { podeAlterar, podeRegistrar } from '@/domain/enums/Papel'
import { calcularProgressoDoMembro } from '@/domain/services/progresso'
import { useAuth } from '@/presentation/hooks/useAuth'
import { useMembro } from '@/presentation/hooks/useMembros'
import {
  useAlterarDataInstrucao,
  useHistoricoDoMembro,
  useInstrucoesDoMembro,
  useRegistrarInstrucao,
} from '@/presentation/hooks/useInstrucoes'
import { HistoricoDeAlteracoes } from '@/presentation/components/HistoricoDeAlteracoes'
import { InstrucaoTable } from '@/presentation/components/InstrucaoTable'
import { ProgressoGrauBadge } from '@/presentation/components/ProgressoGrauBadge'
import { RegistrarInstrucaoForm } from '@/presentation/components/RegistrarInstrucaoForm'
import { ROTULO_DO_GRAU } from '@/presentation/rotulos'
import { formatarData } from '@/presentation/datas'
import { mensagemDeErro } from '@/presentation/erros'

export function MembroDetalhesPage() {
  const { membroId = '' } = useParams()
  const membro = useMembro(membroId)
  const instrucoes = useInstrucoesDoMembro(membroId)

  if (membro.isPending || instrucoes.isPending) {
    return <p className="p-6 text-pedra">Carregando…</p>
  }

  if (membro.isError || instrucoes.isError) {
    return (
      <main className="flex flex-col gap-3 p-6">
        <p role="alert" className="text-sm text-red-700">
          {mensagemDeErro(membro.error ?? instrucoes.error)}
        </p>
        <VoltarAoInicio />
      </main>
    )
  }

  return (
    <FichaDoMembro
      membro={membro.data}
      instrucoes={instrucoes.data}
      membroId={membroId}
    />
  )
}

interface FichaDoMembroProps {
  membro: Membro
  instrucoes: Instrucao[]
  membroId: string
}

function FichaDoMembro({ membro, instrucoes, membroId }: FichaDoMembroProps) {
  const { usuario } = useAuth()
  const registro = useRegistrarInstrucao(membroId)
  const correcao = useAlterarDataInstrucao(membroId)
  // Fora do gate de carregamento da página: a trilha é apêndice, não pode
  // segurar a ficha inteira nem derrubá-la se falhar.
  const historico = useHistoricoDoMembro(membroId)

  if (usuario === null) return null

  const progressoPorGrau = calcularProgressoDoMembro(
    membro.grauAtual,
    instrucoes,
  )
  const progressoAtual = progressoPorGrau[progressoPorGrau.length - 1]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <VoltarAoInicio />
        <h1 className="text-2xl font-semibold text-marinho">{membro.nome}</h1>
        <p className="text-sm text-pedra">
          {ROTULO_DO_GRAU[membro.grauAtual]}
          {membro.dataIniciacao !== null &&
            ` · iniciado em ${formatarData(membro.dataIniciacao)}`}
          {!membro.ativo && ' · inativo'}
        </p>
      </header>

      {podeRegistrar(usuario.papel) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium text-marinho">
            Registrar instrução
          </h2>
          <RegistrarInstrucaoForm
            grau={membro.grauAtual}
            numerosPendentes={progressoAtual.numerosPendentes}
            enviando={registro.isPending}
            erro={registro.error !== null ? mensagemDeErro(registro.error) : null}
            aoEnviar={(dados) => registro.mutate(dados)}
          />
        </section>
      )}

      {correcao.error !== null && (
        <p role="alert" className="text-sm text-red-700">
          {mensagemDeErro(correcao.error)}
        </p>
      )}

      {progressoPorGrau.map((progresso) => (
        <section key={progresso.grau} className="flex flex-col gap-2">
          <ProgressoGrauBadge progresso={progresso} />
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <InstrucaoTable
              grau={progresso.grau}
              total={progresso.total}
              instrucoes={instrucoes}
              podeCorrigir={podeAlterar(usuario.papel)}
              corrigindo={correcao.isPending}
              aoCorrigir={(dados) => correcao.mutate(dados)}
            />
          </div>
        </section>
      ))}

      {historico.data !== undefined && (
        <HistoricoDeAlteracoes alteracoes={historico.data} />
      )}
    </main>
  )
}

function VoltarAoInicio() {
  return (
    <Link to="/" className="w-fit text-sm text-marinho underline underline-offset-2">
      ← Voltar aos membros
    </Link>
  )
}
