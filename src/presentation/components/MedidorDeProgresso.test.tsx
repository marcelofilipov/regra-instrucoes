import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MedidorDeProgresso } from './MedidorDeProgresso'

describe('MedidorDeProgresso', () => {
  it('expõe o valor a leitor de tela, não só na largura da barra', () => {
    render(
      <MedidorDeProgresso registradas={5} total={7} descricao="Progresso" />,
    )

    const medidor = screen.getByRole('progressbar', { name: 'Progresso' })
    expect(medidor).toHaveAttribute('aria-valuenow', '5')
    expect(medidor).toHaveAttribute('aria-valuemax', '7')
    expect(medidor).toHaveAttribute('aria-valuetext', '5 de 7 instruções')
  })

  it('mostra o valor como texto ao lado da barra', () => {
    render(
      <MedidorDeProgresso registradas={5} total={7} descricao="Progresso" />,
    )

    expect(screen.getByText('5 de 7')).toBeInTheDocument()
  })

  it('preenche na proporção do registrado', () => {
    const { container } = render(
      <MedidorDeProgresso registradas={3} total={4} descricao="Progresso" />,
    )

    const preenchimento = container.querySelector<HTMLElement>(
      '[role="progressbar"] > div',
    )
    expect(preenchimento?.style.width).toBe('75%')
  })

  it('bloco vazio não preenche nada', () => {
    const { container } = render(
      <MedidorDeProgresso registradas={0} total={7} descricao="Progresso" />,
    )

    const preenchimento = container.querySelector<HTMLElement>(
      '[role="progressbar"] > div',
    )
    expect(preenchimento?.style.width).toBe('0%')
  })

  it('total zero não vira divisão por zero na largura', () => {
    const { container } = render(
      <MedidorDeProgresso registradas={0} total={0} descricao="Progresso" />,
    )

    const preenchimento = container.querySelector<HTMLElement>(
      '[role="progressbar"] > div',
    )
    expect(preenchimento?.style.width).toBe('0%')
  })
})
