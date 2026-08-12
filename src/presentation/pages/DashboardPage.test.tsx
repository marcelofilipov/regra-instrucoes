import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
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

/** Um obreiro com uma instrução do grau Aprendiz — 1 de 7. */
async function semearObreiroComUmaInstrucao() {
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
}

beforeEach(() => {
  gestao = criarGestaoEmMemoria()
})

describe('DashboardPage', () => {
  it('lista os membros com o progresso do grau atual', async () => {
    await semearObreiroComUmaInstrucao()

    renderizar(leitor())

    expect(await screen.findByText('Marcelo Rodrigo')).toBeInTheDocument()
    expect(screen.getByText('Aprendiz')).toBeInTheDocument()

    const medidor = screen.getByRole('progressbar', {
      name: 'Progresso de Marcelo Rodrigo no grau Aprendiz',
    })
    expect(medidor).toHaveAttribute('aria-valuetext', '1 de 7 instruções')
  })

  it('resume a Loja acima da lista', async () => {
    await semearObreiroComUmaInstrucao()

    renderizar(leitor())

    const resumo = await screen.findByRole('region', { name: 'Resumo da Loja' })
    expect(within(resumo).getByText('Obreiros')).toBeInTheDocument()
    // 1 instrução registrada de 7 previstas no grau do único obreiro.
    expect(within(resumo).getByText('14%')).toBeInTheDocument()
  })

  it('esconde o resumo enquanto não há obreiro', async () => {
    renderizar(leitor())

    await screen.findByText(/Nenhum membro cadastrado/)
    expect(
      screen.queryByRole('region', { name: 'Resumo da Loja' }),
    ).not.toBeInTheDocument()
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

describe('Exportar dados', () => {
  // jsdom não implementa objectURL nem navegação de download; o que interessa
  // aqui é o que o app entrega ao navegador, então capturamos o clique no link.
  let baixados: { nome: string; conteudo: string }[]
  let cliqueOriginal: () => void

  beforeEach(() => {
    baixados = []
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
    cliqueOriginal = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      baixados.push({ nome: this.download, conteudo: '' })
    }
  })

  afterEach(() => {
    HTMLAnchorElement.prototype.click = cliqueOriginal
  })

  it('editor não vê a exportação', async () => {
    renderizar(editor())

    await screen.findByText('Membros')
    expect(screen.queryByText('Exportar dados')).not.toBeInTheDocument()
  })

  it('leitor não vê a exportação', async () => {
    renderizar(leitor())

    await screen.findByText('Membros')
    expect(screen.queryByText('Exportar dados')).not.toBeInTheDocument()
  })

  it('admin baixa um JSON único', async () => {
    await semearMembro('m1', 'Marcelo Rodrigo')

    renderizar(admin())

    await userEvent.click(
      await screen.findByRole('button', { name: 'Baixar JSON' }),
    )

    await waitFor(() => expect(baixados).toHaveLength(1))
    expect(baixados[0].nome).toMatch(/^loja-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('admin baixa uma planilha por coleção', async () => {
    await semearMembro('m1', 'Marcelo Rodrigo')

    renderizar(admin())

    await userEvent.click(
      await screen.findByRole('button', { name: 'Baixar CSV' }),
    )

    await waitFor(() => expect(baixados).toHaveLength(4))
    expect(baixados.map((a) => a.nome.replace(/-\d{4}-\d{2}-\d{2}/, ''))).toEqual([
      'loja-membros.csv',
      'loja-instrucoes.csv',
      'loja-usuarios.csv',
      'loja-auditoria.csv',
    ])
  })
})
