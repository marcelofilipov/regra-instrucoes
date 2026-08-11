import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ServicosDeGestao } from '@/composition/servicosDeGestao'
import type { Usuario } from '@/domain/entities/Usuario'
import { AuthContext } from '@/presentation/auth/AuthContext'
import { ServicosDeGestaoContext } from '@/presentation/gestao/ServicosDeGestaoContext'
import { sessaoFake } from './fixtures/sessao'

export const CAMINHO_DA_FICHA = '/membros/:membroId'

interface OpcoesDeRenderizacao {
  usuario: Usuario | null
  gestao: ServicosDeGestao
  /** Padrão da rota, quando a página lê parâmetros (ex.: `/membros/:membroId`). */
  caminho?: string
  rotaInicial?: string
}

/** Monta uma página com sessão, serviços e roteamento — como o App faz. */
export function renderizarPagina(
  pagina: ReactElement,
  { usuario, gestao, caminho = '/', rotaInicial = '/' }: OpcoesDeRenderizacao,
) {
  // `retry: false` para um erro esperado falhar o teste rápido, sem re-tentativa.
  const clienteDeConsultas = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={clienteDeConsultas}>
      <AuthContext.Provider value={sessaoFake(usuario)}>
        <ServicosDeGestaoContext.Provider value={gestao}>
          <MemoryRouter initialEntries={[rotaInicial]}>
            <Routes>
              <Route path={caminho} element={pagina} />
              {caminho !== CAMINHO_DA_FICHA && (
                <Route path={CAMINHO_DA_FICHA} element={<p>Ficha do membro</p>} />
              )}
            </Routes>
          </MemoryRouter>
        </ServicosDeGestaoContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}
