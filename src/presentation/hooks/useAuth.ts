import { useContext } from 'react'
import { AuthContext, type Sessao } from '@/presentation/auth/AuthContext'

export function useAuth(): Sessao {
  const sessao = useContext(AuthContext)
  if (sessao === null) {
    throw new Error('useAuth só pode ser usado dentro de <AuthProvider>.')
  }
  return sessao
}
