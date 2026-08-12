import { useMutation } from '@tanstack/react-query'
import {
  paraArquivosCsv,
  paraJson,
  type ArquivoExportado,
} from '@/application/exportacao/serializadores'
import { useAuth } from './useAuth'
import { useServicosDeGestao } from './useServicosDeGestao'
import { exigirUsuario } from '@/presentation/auth/exigirUsuario'
import { baixarArquivo } from '@/presentation/exportacao/baixarArquivo'

export type FormatoDeExportacao = 'json' | 'csv'

/**
 * Lê a Loja inteira e entrega os arquivos ao navegador. Não é `useQuery`: a
 * exportação é ato do usuário, não estado da tela — cachear uma cópia de backup
 * seria justamente o contrário do que se quer.
 */
export function useExportarDados() {
  const { exportarDados } = useServicosDeGestao()
  const { usuario } = useAuth()

  return useMutation<ArquivoExportado[], Error, FormatoDeExportacao>({
    mutationFn: async (formato) => {
      const snapshot = await exportarDados.executar(exigirUsuario(usuario))
      return formato === 'json' ? [paraJson(snapshot)] : paraArquivosCsv(snapshot)
    },
    onSuccess: (arquivos) => arquivos.forEach(baixarArquivo),
  })
}
