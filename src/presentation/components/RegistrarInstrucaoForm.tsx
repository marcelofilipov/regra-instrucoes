import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Grau } from '@/domain/enums/Grau'
import type { DadosDoRegistro } from '@/presentation/hooks/useInstrucoes'
import { ROTULO_DO_GRAU } from '@/presentation/rotulos'
import { deTextoParaData } from '@/presentation/datas'
import {
  BOTAO_PRIMARIO,
  CAMPO,
  CARTAO,
  MENSAGEM_DE_ERRO,
  ROTULO,
} from '@/presentation/estilos'

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
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end ${CARTAO}`}
      aria-label={`Registrar instrução — ${ROTULO_DO_GRAU[grau]}`}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="numero" className={ROTULO}>
          Instrução
        </label>
        <select
          id="numero"
          {...register('numero')}
          className={CAMPO}
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
          className={ROTULO}
        >
          Data de recebimento
        </label>
        <input
          id="dataRecebimento"
          type="date"
          {...register('dataRecebimento')}
          className={CAMPO}
        />
        {errors.dataRecebimento && (
          <span role="alert" className={MENSAGEM_DE_ERRO}>
            {errors.dataRecebimento.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className={`w-full sm:w-fit ${BOTAO_PRIMARIO}`}
      >
        Registrar
      </button>

      {erro !== null && (
        <p role="alert" className={`w-full ${MENSAGEM_DE_ERRO}`}>
          {erro}
        </p>
      )}
    </form>
  )
}
