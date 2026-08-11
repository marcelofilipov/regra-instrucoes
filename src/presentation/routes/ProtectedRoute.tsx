import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Papel } from '@/domain/enums/Papel'
import { useAuth } from '@/presentation/hooks/useAuth'
import { TelaDeCarregamento } from '@/presentation/components/TelaDeCarregamento'

interface ProtectedRouteProps {
  /** Papéis autorizados. Omitido = basta estar autenticado. */
  papeis?: readonly Papel[]
  children: ReactElement
}

/**
 * Bloqueio de rota por autenticação e papel. É a camada de conveniência: a
 * garantia real de acesso está nas Security Rules do Firestore, porque tudo que
 * roda no client pode ser burlado.
 */
export function ProtectedRoute({ papeis, children }: ProtectedRouteProps) {
  const { usuario, carregando } = useAuth()
  const localizacao = useLocation()

  if (carregando) {
    return <TelaDeCarregamento />
  }

  if (usuario === null) {
    return <Navigate to="/login" replace state={{ de: localizacao.pathname }} />
  }

  if (papeis !== undefined && !papeis.includes(usuario.papel)) {
    return <Navigate to="/sem-permissao" replace />
  }

  return children
}
