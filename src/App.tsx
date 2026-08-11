import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { Servicos } from '@/composition/servicos'
import { AuthProvider } from '@/presentation/auth/AuthProvider'
import { ServicosDeGestaoContext } from '@/presentation/gestao/ServicosDeGestaoContext'
import { AppRoutes } from '@/presentation/routes/AppRoutes'

interface AppProps {
  servicos: Servicos
  clienteDeConsultas: QueryClient
}

function App({ servicos, clienteDeConsultas }: AppProps) {
  return (
    <QueryClientProvider client={clienteDeConsultas}>
      <AuthProvider servicos={servicos.autenticacao}>
        <ServicosDeGestaoContext.Provider value={servicos.gestao}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ServicosDeGestaoContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
