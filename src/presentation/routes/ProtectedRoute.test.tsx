import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthContext, type Sessao } from '@/presentation/auth/AuthContext'
import { usuarioCom } from '@/test/fixtures/usuarios'
import { Papel } from '@/domain/enums/Papel'

function sessaoFake(sobrescreve: Partial<Sessao> = {}): Sessao {
  return {
    usuario: null,
    carregando: false,
    erroDeSessao: null,
    entrar: async () => {},
    criarConta: async () => {},
    sair: async () => {},
    ...sobrescreve,
  }
}

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
    renderizarRotaProtegida(sessaoFake({ carregando: true }))

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('manda visitante anônimo para o login', () => {
    renderizarRotaProtegida(sessaoFake())

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('libera usuário autenticado quando a rota não exige papel', () => {
    renderizarRotaProtegida(sessaoFake({ usuario: usuarioCom(Papel.LEITOR) }))

    expect(screen.getByText('Área protegida')).toBeInTheDocument()
  })

  it('bloqueia papel fora da lista autorizada', () => {
    renderizarRotaProtegida(sessaoFake({ usuario: usuarioCom(Papel.LEITOR) }), [
      Papel.ADMIN,
    ])

    expect(screen.getByText('Sem permissão')).toBeInTheDocument()
  })

  it('libera papel presente na lista autorizada', () => {
    renderizarRotaProtegida(sessaoFake({ usuario: usuarioCom(Papel.ADMIN) }), [
      Papel.ADMIN,
    ])

    expect(screen.getByText('Área protegida')).toBeInTheDocument()
  })
})
