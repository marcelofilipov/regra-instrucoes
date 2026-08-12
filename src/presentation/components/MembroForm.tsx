import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Grau } from '@/domain/enums/Grau'
import type { DadosDeNovoMembro } from '@/application/useCases/CadastrarMembroUseCase'
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
  nome: z.string().trim().min(3, 'Informe o nome completo.'),
  grauAtual: z.enum([Grau.APRENDIZ, Grau.COMPANHEIRO, Grau.MESTRE]),
  dataIniciacao: z.string(),
})

type CamposDoFormulario = z.infer<typeof esquema>

interface MembroFormProps {
  aoEnviar(dados: DadosDeNovoMembro): void
  enviando: boolean
  erro: string | null
}

export function MembroForm({ aoEnviar, enviando, erro }: MembroFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CamposDoFormulario>({
    resolver: zodResolver(esquema),
    defaultValues: { nome: '', grauAtual: Grau.APRENDIZ, dataIniciacao: '' },
  })

  function enviar(campos: CamposDoFormulario) {
    aoEnviar({
      nome: campos.nome.trim(),
      grauAtual: campos.grauAtual,
      dataIniciacao:
        campos.dataIniciacao === ''
          ? null
          : deTextoParaData(campos.dataIniciacao),
    })
    reset()
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      className={`flex flex-col gap-3 ${CARTAO}`}
      aria-label="Cadastrar membro"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className={ROTULO}>
          Nome
        </label>
        <input
          id="nome"
          {...register('nome')}
          className={CAMPO}
        />
        {errors.nome && (
          <span role="alert" className={MENSAGEM_DE_ERRO}>
            {errors.nome.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="grauAtual" className={ROTULO}>
          Grau atual
        </label>
        <select
          id="grauAtual"
          {...register('grauAtual')}
          className={CAMPO}
        >
          {Object.values(Grau).map((grau) => (
            <option key={grau} value={grau}>
              {ROTULO_DO_GRAU[grau]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="dataIniciacao"
          className={ROTULO}
        >
          Data de iniciação (opcional)
        </label>
        <input
          id="dataIniciacao"
          type="date"
          {...register('dataIniciacao')}
          className={CAMPO}
        />
      </div>

      {erro !== null && (
        <p role="alert" className={MENSAGEM_DE_ERRO}>
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className={`w-full sm:w-fit ${BOTAO_PRIMARIO}`}
      >
        Cadastrar membro
      </button>
    </form>
  )
}
