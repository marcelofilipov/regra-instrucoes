import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Grau } from '@/domain/enums/Grau'
import type { DadosDoRegistro } from '@/presentation/hooks/useInstrucoes'
import { ROTULO_DO_GRAU } from '@/presentation/rotulos'
import { deTextoParaData } from '@/presentation/datas'

const esquema = z.object({
  numero: z.coerce.number().int().positive(),
  dataRecebimento: z.string().min(1, 'Informe a data de recebimento.'),
})

type CamposDoFormulario = z.input<typeof esquema>

interface RegistrarInstrucaoFormProps {
  grau: Grau
  numerosPendentes: readonly number[]
  aoEnviar(dados: DadosDoRegistro): void
  enviando: boolean
  erro: string | null
}

/**
 * Só oferece os números que ainda faltam: registrar de novo o que já existe é
 * recusado pelo caso de uso, e o formulário não deve sequer sugerir isso.
 */
export function RegistrarInstrucaoForm({
  grau,
  numerosPendentes,
  aoEnviar,
  enviando,
  erro,
}: RegistrarInstrucaoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CamposDoFormulario>({
    resolver: zodResolver(esquema),
    defaultValues: { numero: numerosPendentes[0], dataRecebimento: '' },
  })

  if (numerosPendentes.length === 0) {
    return (
      <p className="text-sm text-pedra">
        Todas as instruções do grau {ROTULO_DO_GRAU[grau]} já foram registradas.
      </p>
    )
  }

  function enviar(campos: CamposDoFormulario) {
    aoEnviar({
      grau,
      numero: Number(campos.numero),
      dataRecebimento: deTextoParaData(campos.dataRecebimento),
    })
    reset()
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm"
      aria-label={`Registrar instrução — ${ROTULO_DO_GRAU[grau]}`}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="numero" className="text-sm font-medium text-marinho">
          Instrução
        </label>
        <select
          id="numero"
          {...register('numero')}
          className="rounded-md border border-pedra/40 px-3 py-2"
        >
          {numerosPendentes.map((numero) => (
            <option key={numero} value={numero}>
              {numero}ª
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="dataRecebimento"
          className="text-sm font-medium text-marinho"
        >
          Data de recebimento
        </label>
        <input
          id="dataRecebimento"
          type="date"
          {...register('dataRecebimento')}
          className="rounded-md border border-pedra/40 px-3 py-2"
        />
        {errors.dataRecebimento && (
          <span role="alert" className="text-sm text-red-700">
            {errors.dataRecebimento.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-marinho px-4 py-2 font-medium text-marfim disabled:opacity-60"
      >
        Registrar
      </button>

      {erro !== null && (
        <p role="alert" className="w-full text-sm text-red-700">
          {erro}
        </p>
      )}
    </form>
  )
}
