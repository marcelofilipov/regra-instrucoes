import { useState, type FormEvent } from 'react'
import type { Instrucao } from '@/domain/entities/Instrucao'
import type { Grau } from '@/domain/enums/Grau'
import type { DadosDaCorrecao } from '@/presentation/hooks/useInstrucoes'
import { formatarData, deTextoParaData, paraTextoDeInput } from '@/presentation/datas'

interface InstrucaoTableProps {
  grau: Grau
  total: number
  instrucoes: readonly Instrucao[]
  /** Corrigir data é ato de Admin; a Security Rule recusa qualquer outro. */
  podeCorrigir: boolean
  aoCorrigir(dados: DadosDaCorrecao): void
  corrigindo: boolean
}

export function InstrucaoTable({
  grau,
  total,
  instrucoes,
  podeCorrigir,
  aoCorrigir,
  corrigindo,
}: InstrucaoTableProps) {
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null)

  const porNumero = new Map(
    instrucoes
      .filter((instrucao) => instrucao.grau === grau)
      .map((instrucao) => [instrucao.numero, instrucao]),
  )

  function confirmarCorrecao(instrucaoId: string, novaData: Date) {
    aoCorrigir({ instrucaoId, novaData })
    setIdEmEdicao(null)
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-pedra">
        <tr>
          <th scope="col" className="py-1 font-medium">
            Instrução
          </th>
          <th scope="col" className="py-1 font-medium">
            Data
          </th>
          {podeCorrigir && <th scope="col" className="py-1 font-medium" />}
        </tr>
      </thead>
      <tbody>
        {numerosDe(total).map((numero) => {
          const instrucao = porNumero.get(numero) ?? null
          const editando = instrucao !== null && idEmEdicao === instrucao.id

          return (
            <tr key={numero} className="border-t border-pedra/20">
              <th scope="row" className="py-2 font-normal">
                {numero}ª
              </th>
              <td className="py-2">
                {editando ? (
                  <FormularioDeCorrecao
                    dataAtual={instrucao.dataRecebimento}
                    salvando={corrigindo}
                    aoConfirmar={(novaData) =>
                      confirmarCorrecao(instrucao.id, novaData)
                    }
                    aoCancelar={() => setIdEmEdicao(null)}
                  />
                ) : (
                  <DataDaInstrucao instrucao={instrucao} />
                )}
              </td>
              {podeCorrigir && (
                <td className="py-2 text-right">
                  {instrucao !== null && !editando && (
                    <button
                      type="button"
                      onClick={() => setIdEmEdicao(instrucao.id)}
                      className="text-marinho underline underline-offset-2"
                    >
                      Corrigir
                    </button>
                  )}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function DataDaInstrucao({ instrucao }: { instrucao: Instrucao | null }) {
  if (instrucao === null) {
    return <span className="text-pedra">pendente</span>
  }
  return (
    <span>
      {formatarData(instrucao.dataRecebimento)}
      {instrucao.foiAlterada && (
        <span className="ml-2 text-xs text-pedra">(corrigida)</span>
      )}
    </span>
  )
}

interface FormularioDeCorrecaoProps {
  dataAtual: Date
  salvando: boolean
  aoConfirmar(novaData: Date): void
  aoCancelar(): void
}

function FormularioDeCorrecao({
  dataAtual,
  salvando,
  aoConfirmar,
  aoCancelar,
}: FormularioDeCorrecaoProps) {
  const [texto, setTexto] = useState(paraTextoDeInput(dataAtual))

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    aoConfirmar(deTextoParaData(texto))
  }

  return (
    <form onSubmit={enviar} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="nova-data">
        Nova data
      </label>
      <input
        id="nova-data"
        type="date"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        className="rounded-md border border-pedra/40 px-2 py-1"
      />
      <button
        type="submit"
        disabled={salvando}
        className="rounded-md bg-marinho px-2 py-1 text-marfim disabled:opacity-60"
      >
        Salvar
      </button>
      <button type="button" onClick={aoCancelar} className="text-pedra">
        Cancelar
      </button>
    </form>
  )
}

function numerosDe(total: number): number[] {
  return Array.from({ length: total }, (_, indice) => indice + 1)
}
