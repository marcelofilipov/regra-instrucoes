import { useExportarDados } from '@/presentation/hooks/useExportarDados'
import { mensagemDeErro } from '@/presentation/erros'
import { BOTAO_SECUNDARIO, MENSAGEM_DE_ERRO } from '@/presentation/estilos'

/**
 * Backup sob demanda para o Admin. O Spark não tem exportação agendada, então
 * é isto que existe de rede de segurança antes de uma operação sensível.
 */
export function ExportarDados() {
  const exportacao = useExportarDados()

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium text-marinho">Exportar dados</h2>
      <p className="text-sm text-pedra">
        Baixa uma cópia de membros, instruções, usuários e da trilha de
        auditoria. JSON serve para restaurar; CSV abre em planilha.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={exportacao.isPending}
          onClick={() => exportacao.mutate('json')}
          className={BOTAO_SECUNDARIO}
        >
          Baixar JSON
        </button>
        <button
          type="button"
          disabled={exportacao.isPending}
          onClick={() => exportacao.mutate('csv')}
          className={BOTAO_SECUNDARIO}
        >
          Baixar CSV
        </button>
      </div>

      {exportacao.isError && (
        <p role="alert" className={MENSAGEM_DE_ERRO}>
          {mensagemDeErro(exportacao.error)}
        </p>
      )}
    </section>
  )
}
