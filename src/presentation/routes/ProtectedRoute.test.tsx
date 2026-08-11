import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthContext, type Sessao } from '@/presentation/auth/AuthContext'
import { usuarioCom } from '@/test/fixtures/usuarios'
import { sessaoFake } from '@/test/fixtures/sessao'
import { Papel } from '@/domain/enums/Papel'

function renderizarRotaProtegida(sessao: Sessao, papeis?: readonly Papel[]) {
  render(
    <AuthContext.Provider value={sessao}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute papeis={papeis}>
                <p>Área protegida</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Tela de login</p>} />
          <Route path="/sem-permissao" element={<p>Sem permissão</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('espera a sessão carregar antes de decidir', () => {
    renderizarRotaProtegida(sessaoFake(null, { carregando: true }))

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('manda visitante anônimo para o login', () => {
    renderizarRotaProtegida(sessaoFake())

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('libera usuário autenticado quando a rota não exige papel', () => {
    renderizarRotaProtegida(sessaoFake(usuarioCom(Papel.LEITOR)))

    expect(screen.getByText('Área protegida')).toBeInTheDocument()
  })

  it('bloqueia papel fora da lista autorizada', () => {
    renderizarRotaProtegida(sessaoFake(usuarioCom(Papel.LEITOR)), [
      Papel.ADMIN,
    ])

    expect(screen.getByText('Sem permissão')).toBeInTheDocument()
  })

  it('libera papel presente na lista autorizada', () => {
    renderizarRotaProtegida(sessaoFake(usuarioCom(Papel.ADMIN)), [
      Papel.ADMIN,
    ])

    expect(screen.getByText('Área protegida')).toBeInTheDocument()
  })
})
