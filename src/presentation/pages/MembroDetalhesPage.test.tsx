import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MembroDetalhesPage } from './MembroDetalhesPage'
import { renderizarPagina, CAMINHO_DA_FICHA } from '@/test/renderizarPagina'
import {
  criarGestaoEmMemoria,
  type GestaoEmMemoria,
} from '@/test/fakes/servicosDeGestaoEmMemoria'
import { admin, editor, leitor } from '@/test/fixtures/usuarios'
import { Membro } from '@/domain/entities/Membro'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'
import type { Usuario } from '@/domain/entities/Usuario'

const MEMBRO_ID = 'm1'

let gestao: GestaoEmMemoria

function renderizar(usuario: Usuario) {
  return renderizarPagina(<MembroDetalhesPage />, {
    usuario,
    gestao: gestao.servicos,
    caminho: CAMINHO_DA_FICHA,
    rotaInicial: `/membros/${MEMBRO_ID}`,
  })
}

// Meio-dia local, como o app grava: `new Date('2026-03-10')` seria meia-noite
// UTC e apareceria como 09/03 em fuso negativo.
const DEZ_DE_MARCO = new Date(2026, 2, 10, 12)

async function semearInstrucao(numero: number, data = DEZ_DE_MARCO) {
  await gestao.instrucoes.salvar(
    Instrucao.registrar({
      id: `i${numero}`,
      membroId: MEMBRO_ID,
      grau: Grau.APRENDIZ,
      numero,
      dataRecebimento: data,
      registradoPor: editor().id,
      registradoEm: data,
    }),
  )
}

beforeEach(async () => {
  gestao = criarGestaoEmMemoria()
  await gestao.membros.salvar(
    Membro.cadastrar({
      id: MEMBRO_ID,
      nome: 'Marcelo Rodrigo',
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: new Date('2026-01-05'),
      quando: new Date('2026-01-05'),
    }),
  )
})

describe('MembroDetalhesPage', () => {
  it('mostra a ficha com o progresso do grau', async () => {
    await semearInstrucao(1)

    renderizar(leitor())

    expect(await screen.findByText('Marcelo Rodrigo')).toBeInTheDocument()
    expect(screen.getByText(/Aprendiz — 1 de 7 instruções/)).toBeInTheDocument()
    expect(screen.getByText('10/03/2026')).toBeInTheDocument()
  })

  it('leitor não vê formulário de registro nem ação de corrigir', async () => {
    await semearInstrucao(1)

    renderizar(leitor())

    await screen.findByText('Marcelo Rodrigo')
    expect(
      screen.queryByRole('button', { name: 'Registrar' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Corrigir' }),
    ).not.toBeInTheDocument()
  })

  it('editor registra uma instrução e ela aparece na tabela', async () => {
    renderizar(editor())

    await screen.findByText('Marcelo Rodrigo')
    await userEvent.type(
      screen.getByLabelText('Data de recebimento'),
      '2026-04-15',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText('15/04/2026')).toBeInTheDocument()
    await waitFor(() => expect(gestao.instrucoes.salvos.size).toBe(1))
  })

  it('editor não recebe a ação de corrigir data já registrada', async () => {
    await semearInstrucao(1)

    renderizar(editor())

    await screen.findByText('Marcelo Rodrigo')
    expect(
      screen.queryByRole('button', { name: 'Corrigir' }),
    ).not.toBeInTheDocument()
  })

  it('admin corrige a data e a tabela marca a correção', async () => {
    await semearInstrucao(1)

    renderizar(admin())

    await userEvent.click(
      await screen.findByRole('button', { name: 'Corrigir' }),
    )
    await userEvent.clear(screen.getByLabelText('Nova data'))
    await userEvent.type(screen.getByLabelText('Nova data'), '2026-03-17')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('17/03/2026')).toBeInTheDocument()
    expect(screen.getByText('(corrigida)')).toBeInTheDocument()
  })

  it('avisa quando o membro não existe', async () => {
    gestao.membros.salvos.clear()

    renderizar(leitor())

    expect(
      await screen.findByText(/Membro não encontrado/),
    ).toBeInTheDocument()
  })
})
