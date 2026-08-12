import type { AlteracaoDoHistorico } from '@/application/useCases/ListarHistoricoDoMembroUseCase'
import { ROTULO_DO_GRAU } from '@/presentation/rotulos'
import { formatarData, formatarDataHora } from '@/presentation/datas'

interface HistoricoDeAlteracoesProps {
  alteracoes: readonly AlteracaoDoHistorico[]
}

/**
 * A trilha de auditoria como ela interessa a quem confere a ficha: o que mudou,
 * de quando para quando, por quem. Some quando não houve correção nenhuma —
 * seção vazia em ficha limpa é só ruído.
 */
export function HistoricoDeAlteracoes({ alteracoes }: HistoricoDeAlteracoesProps) {
  if (alteracoes.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium text-marinho">Histórico de alterações</h2>
      <ul className="flex flex-col gap-2 rounded-lg bg-white p-4 text-sm shadow-sm">
        {alteracoes.map((alteracao) => (
          <li
            key={alteracao.registro.id}
            className="border-t border-pedra/20 pt-2 first:border-0 first:pt-0"
          >
            <LinhaDoHistorico alteracao={alteracao} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function LinhaDoHistorico({ alteracao }: { alteracao: AlteracaoDoHistorico }) {
  const { registro, instrucao, autor } = alteracao

  return (
    <>
      <p>
        <span className="font-medium text-marinho">
          {ROTULO_DO_GRAU[instrucao.grau]} · {instrucao.numero}ª instrução
        </span>
        {' — '}
        <ValorAlterado registro={registro} />
      </p>
      <p className="text-pedra">
        por {autor} em {formatarDataHora(registro.alteradoEm)}
      </p>
    </>
  )
}

function ValorAlterado({
  registro,
}: {
  registro: AlteracaoDoHistorico['registro']
}) {
  if (!registro.ehAlteracaoDeData) {
    return (
      <span>
        {registro.campoAlterado}: {registro.valorAnterior} → {registro.valorNovo}
      </span>
    )
  }

  return (
    <span>
      data: {formatarData(new Date(registro.valorAnterior))} →{' '}
      {formatarData(new Date(registro.valorNovo))}
    </span>
  )
}
