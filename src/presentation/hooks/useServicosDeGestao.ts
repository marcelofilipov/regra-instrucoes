import { useContext } from 'react'
import type { ServicosDeGestao } from '@/composition/servicosDeGestao'
import { ServicosDeGestaoContext } from '@/presentation/gestao/ServicosDeGestaoContext'

export function useServicosDeGestao(): ServicosDeGestao {
  const servicos = useContext(ServicosDeGestaoContext)
  if (servicos === null) {
    throw new Error(
      'useServicosDeGestao precisa de <ServicosDeGestaoContext.Provider> acima na árvore.',
    )
  }
  return servicos
}
