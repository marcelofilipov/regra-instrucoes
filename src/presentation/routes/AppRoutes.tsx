import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/presentation/pages/LoginPage'
import { DashboardPage } from '@/presentation/pages/DashboardPage'
import { SemPermissaoPage } from '@/presentation/pages/SemPermissaoPage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sem-permissao" element={<SemPermissaoPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
