import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardPage } from './DashboardPage'
import { renderizarPagina } from '@/test/renderizarPagina'
import {
  criarGestaoEmMemoria,
  type GestaoEmMemoria,
} from '@/test/fakes/servicosDeGestaoEmMemoria'
import { admin, editor, leitor } from '@/test/fixtures/usuarios'
import { Membro } from '@/domain/entities/Membro'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'
import type { Usuario } from '@/domain/entities/Usuario'

let gestao: GestaoEmMemoria

function renderizar(usuario: Usuario) {
  return renderizarPagina(<DashboardPage />, {
    usuario,
    gestao: gestao.servicos,
  })
}

async function semearMembro(id: string, nome: string) {
  await gestao.membros.salvar(
    Membro.cadastrar({
      id,
      nome,
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: null,
      quando: new Date('2026-01-01'),
    }),
  )
}

beforeEach(() => {
  gestao = criarGestaoEmMemoria()
})

describe('DashboardPage', () => {
  it('lista os membros com o progresso do grau atual', async () => {
    await semearMembro('m1', 'Marcelo Rodrigo')
    await gestao.instrucoes.salvar(
      Instrucao.registrar({
        id: 'i1',
        membroId: 'm1',
        grau: Grau.APRENDIZ,
        numero: 1,
        dataRecebimento: new Date('2026-03-10'),
        registradoPor: editor().id,
        registradoEm: new Date('2026-03-10'),
      }),
    )

    renderizar(leitor())

    expect(await screen.findByText('Marcelo Rodrigo')).toBeInTheDocument()
    expect(
      screen.getByText(/Aprendiz — 1 de 7 instruções/),
    ).toBeInTheDocument()
  })

  it('esconde o cadastro de membro do leitor', async () => {
    renderizar(leitor())

    await screen.findByText(/Nenhum membro cadastrado/)
    expect(
      screen.queryByRole('button', { name: 'Novo membro' }),
    ).not.toBeInTheDocument()
  })

  it('oferece o cadastro ao editor', async () => {
    renderizar(editor())

    expect(
      await screen.findByRole('button', { name: 'Novo membro' }),
    ).toBeInTheDocument()
  })

  it('cadastra um membro e ele aparece na lista', async () => {
    const usuario = admin()
    renderizar(usuario)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Novo membro' }),
    )
    await userEvent.type(screen.getByLabelText('Nome'), 'Antônio Carlos')
    await userEvent.click(
      screen.getByRole('button', { name: 'Cadastrar membro' }),
    )

    expect(await screen.findByText('Antônio Carlos')).toBeInTheDocument()
    await waitFor(() => expect(gestao.membros.salvos.size).toBe(1))
  })

  it('recusa nome curto antes de chamar o caso de uso', async () => {
    renderizar(editor())

    await userEvent.click(
      await screen.findByRole('button', { name: 'Novo membro' }),
    )
    await userEvent.type(screen.getByLabelText('Nome'), 'Jo')
    await userEvent.click(
      screen.getByRole('button', { name: 'Cadastrar membro' }),
    )

    expect(
      await screen.findByText('Informe o nome completo.'),
    ).toBeInTheDocument()
    expect(gestao.membros.salvos.size).toBe(0)
  })
})
