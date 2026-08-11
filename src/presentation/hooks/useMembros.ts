import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Membro } from '@/domain/entities/Membro'
import type { DadosDeNovoMembro } from '@/application/useCases/CadastrarMembroUseCase'
import { useAuth } from './useAuth'
import { useServicosDeGestao } from './useServicosDeGestao'
import { exigirUsuario } from '@/presentation/auth/exigirUsuario'

/**
 * Prefixo comum das consultas de membro. Invalidar por ele derruba a lista, o
 * painel de progresso e a ficha individual de uma vez.
 */
export const CHAVE_DE_MEMBROS = ['membros'] as const

export function useProgressoDosMembros() {
  const { listarProgressoDosMembros } = useServicosDeGestao()

  return useQuery({
    queryKey: [...CHAVE_DE_MEMBROS, 'progresso'],
    queryFn: () => listarProgressoDosMembros.executar(),
  })
}

export function useMembro(membroId: string) {
  const { obterMembro } = useServicosDeGestao()

  return useQuery({
    queryKey: [...CHAVE_DE_MEMBROS, membroId],
    queryFn: () => obterMembro.executar(membroId),
  })
}

export function useCadastrarMembro() {
  const { cadastrarMembro } = useServicosDeGestao()
  const { usuario } = useAuth()
  const clienteDeConsultas = useQueryClient()

  return useMutation<Membro, Error, DadosDeNovoMembro>({
    mutationFn: (dados) => cadastrarMembro.executar(exigirUsuario(usuario), dados),
    onSuccess: () =>
      clienteDeConsultas.invalidateQueries({ queryKey: CHAVE_DE_MEMBROS }),
  })
}
