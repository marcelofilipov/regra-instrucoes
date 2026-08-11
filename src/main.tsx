import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { criarServicos } from '@/composition/servicos'

// Construídos uma vez, fora do React: a árvore recebe tudo pronto.
const servicos = criarServicos()

// Leitura do Firestore custa cota do Spark: manter o dado fresco por 5 min
// evita refetch a cada troca de tela.
const clienteDeConsultas = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App servicos={servicos} clienteDeConsultas={clienteDeConsultas} />
  </StrictMode>,
)
