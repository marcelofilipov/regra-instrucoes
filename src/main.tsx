import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { criarServicosDeAutenticacao } from '@/composition/servicosDeAutenticacao'

// Construído uma vez, fora do React: a árvore recebe as dependências prontas.
const servicos = criarServicosDeAutenticacao()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App servicos={servicos} />
  </StrictMode>,
)
