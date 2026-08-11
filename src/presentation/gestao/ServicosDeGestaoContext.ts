import { createContext } from 'react'
import type { ServicosDeGestao } from '@/composition/servicosDeGestao'

export const ServicosDeGestaoContext = createContext<ServicosDeGestao | null>(
  null,
)
