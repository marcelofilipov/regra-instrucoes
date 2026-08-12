import { useState } from 'react'
import { Link } from 'react-router-dom'
import { podeAlterar, podeRegistrar } from '@/domain/enums/Papel'
import { useAuth } from '@/presentation/hooks/useAuth'
import {
  useCadastrarMembro,
  useProgressoDosMembros,
} from '@/presentation/hooks/useMembros'
import { calcularResumoDaLoja } from '@/domain/services/progresso'
import { ExportarDados } from '@/presentation/components/ExportarDados'
import { MedidorDeProgresso } from '@/presentation/components/MedidorDeProgresso'
import { MembroForm } from '@/presentation/components/MembroForm'
import { PainelDeResumo } from '@/presentation/components/PainelDeResumo'
import { ProgressoGrauBadge } from '@/presentation/components/ProgressoGrauBadge'
import { ROTULO_DO_GRAU, ROTULO_DO_PAPEL } from '@/presentation/rotulos'
import { mensagemDeErro } from '@/presentation/erros'
import {
  BOTAO_DESTAQUE,
  BOTAO_SECUNDARIO,
  CARTAO,
  LINK,
  MENSAGEM_DE_ERRO,
  PAGINA,
} from '@/presentation/estilos'

export function DashboardPage() {
  const { usuario, sair } = useAuth()
  const painel = useProgressoDosMembros()
  const cadastro = useCadastrarMembro()
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)

  if (usuario === null) return null
  const podeCadastrar = podeRegistrar(usuario.papel)

  return (
    <main className={PAGINA}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-marinho">
            Controle de Instruções
          </h1>
          <p className="text-sm text-pedra">
            {usuario.nome} · {ROTULO_DO_PAPEL[usuario.papel]}
          </p>
        </div>
        <button
          type="button"
          onClick={sair}
          className={BOTAO_SECUNDARIO}
        >
          Sair
        </button>
      </header>

      {podeCadastrar && (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setMostrandoFormulario(!mostrandoFormulario)}
            className={`w-full sm:w-fit ${BOTAO_DESTAQUE}`}
          >
            {mostrandoFormulario ? 'Cancelar' : 'Novo membro'}
          </button>

          {mostrandoFormulario && (
            <MembroForm
              enviando={cadastro.isPending}
              erro={
                cadastro.error !== null ? mensagemDeErro(cadastro.error) : null
              }
              aoEnviar={(dados) =>
                cadastro.mutate(dados, {
                  onSuccess: () => setMostrandoFormulario(false),
                })
              }
            />
          )}
        </section>
      )}

      {/* Só aparece com obreiro cadastrado: "0 de 0" e "0%" não informam nada
          e ainda competem com a mensagem que ensina a começar. */}
      {painel.data !== undefined && painel.data.length > 0 && (
        <PainelDeResumo
          resumo={calcularResumoDaLoja(
            painel.data.map(({ progressoAtual }) => progressoAtual),
          )}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-marinho">Membros</h2>

        {painel.isPending && <p className="text-pedra">Carregando membros…</p>}

        {painel.isError && (
          <p role="alert" className={MENSAGEM_DE_ERRO}>
            {mensagemDeErro(painel.error)}
          </p>
        )}

        {painel.data?.length === 0 && (
          <p className="text-pedra">
            Nenhum membro cadastrado ainda
            {podeCadastrar ? ' — comece por "Novo membro".' : '.'}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {painel.data?.map(({ membro, progressoAtual }) => (
            <li key={membro.id} className={`flex flex-col gap-3 ${CARTAO}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={`/membros/${membro.id}`}
                  className={`font-medium ${LINK}`}
                >
                  {membro.nome}
                </Link>
                <ProgressoGrauBadge progresso={progressoAtual} />
              </div>
              <MedidorDeProgresso
                registradas={progressoAtual.registradas}
                total={progressoAtual.total}
                descricao={`Progresso de ${membro.nome} no grau ${ROTULO_DO_GRAU[progressoAtual.grau]}`}
              />
            </li>
          ))}
        </ul>
      </section>

      {podeAlterar(usuario.papel) && <ExportarDados />}
    </main>
  )
}
