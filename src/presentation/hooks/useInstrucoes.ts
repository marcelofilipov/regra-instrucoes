import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import type { Instrucao } from '@/domain/entities/Instrucao'
import type { DadosDeNovaInstrucao } from '@/application/useCases/RegistrarInstrucaoUseCase'
import { useAuth } from './useAuth'
import { useServicosDeGestao } from './useServicosDeGestao'
import { CHAVE_DE_MEMBROS } from './useMembros'
import { exigirUsuario } from '@/presentation/auth/exigirUsuario'

export function chaveDeInstrucoes(membroId: string) {
  return ['instrucoes', membroId] as const
}

export function chaveDoHistorico(membroId: string) {
  return ['historico', membroId] as const
}

export function useHistoricoDoMembro(membroId: string) {
  const { listarHistoricoDoMembro } = useServicosDeGestao()

  return useQuery({
    queryKey: chaveDoHistorico(membroId),
    queryFn: () => listarHistoricoDoMembro.executar(membroId),
  })
}

export function useInstrucoesDoMembro(membroId: string) {
  const { listarInstrucoesPorMembro } = useServicosDeGestao()

  return useQuery({
    queryKey: chaveDeInstrucoes(membroId),
    queryFn: () => listarInstrucoesPorMembro.executar(membroId),
  })
}

/** Dados do formulário: o `membroId` vem da rota, não do campo. */
export type DadosDoRegistro = Omit<DadosDeNovaInstrucao, 'membroId'>

export function useRegistrarInstrucao(membroId: string) {
  const { registrarInstrucao } = useServicosDeGestao()
  const { usuario } = useAuth()
  const clienteDeConsultas = useQueryClient()

  return useMutation<Instrucao, Error, DadosDoRegistro>({
    mutationFn: (dados) =>
      registrarInstrucao.executar(exigirUsuario(usuario), {
        ...dados,
        membroId,
      }),
    onSuccess: () => invalidarInstrucoes(clienteDeConsultas, membroId),
  })
}

export interface DadosDaCorrecao {
  instrucaoId: string
  novaData: Date
}

export function useAlterarDataInstrucao(membroId: string) {
  const { alterarDataInstrucao } = useServicosDeGestao()
  const { usuario } = useAuth()
  const clienteDeConsultas = useQueryClient()

  return useMutation<Instrucao, Error, DadosDaCorrecao>({
    mutationFn: (dados) =>
      alterarDataInstrucao.executar(exigirUsuario(usuario), dados),
    onSuccess: () => invalidarInstrucoes(clienteDeConsultas, membroId),
  })
}

/**
 * Mudou instrução, mudou o painel de progresso — e, se foi correção, mudou
 * também a trilha de auditoria. Os três caches caem juntos.
 */
function invalidarInstrucoes(
  clienteDeConsultas: QueryClient,
  membroId: string,
): Promise<unknown> {
  return Promise.all([
    clienteDeConsultas.invalidateQueries({
      queryKey: chaveDeInstrucoes(membroId),
    }),
    clienteDeConsultas.invalidateQueries({
      queryKey: chaveDoHistorico(membroId),
    }),
    clienteDeConsultas.invalidateQueries({ queryKey: CHAVE_DE_MEMBROS }),
  ])
}
