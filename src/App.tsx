import { BrowserRouter } from 'react-router-dom'
import type { ServicosDeAutenticacao } from '@/composition/servicosDeAutenticacao'
import { AuthProvider } from '@/presentation/auth/AuthProvider'
import { AppRoutes } from '@/presentation/routes/AppRoutes'

interface AppProps {
  servicos: ServicosDeAutenticacao
}

function App({ servicos }: AppProps) {
  return (
    <AuthProvider servicos={servicos}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
