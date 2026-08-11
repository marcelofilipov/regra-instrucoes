import { describe, it, expect, beforeEach } from 'vitest'
import { RegistrarInstrucaoUseCase } from './RegistrarInstrucaoUseCase'
import { InstrucaoRepositoryEmMemoria } from '@/test/fakes/InstrucaoRepositoryEmMemoria'
import { MembroRepositoryEmMemoria } from '@/test/fakes/MembroRepositoryEmMemoria'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { admin, editor, leitor } from '@/test/fixtures/usuarios'
import { Membro } from '@/domain/entities/Membro'
import { Grau } from '@/domain/enums/Grau'
import { DomainError } from '@/domain/errors/DomainError'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

const AGORA = new Date('2026-08-11T12:00:00Z')
const MEMBRO_ID = 'membro-1'

const dadosValidos = {
  membroId: MEMBRO_ID,
  grau: Grau.APRENDIZ,
  numero: 1,
  dataRecebimento: new Date('2026-03-10'),
}

let instrucoes: InstrucaoRepositoryEmMemoria
let membros: MembroRepositoryEmMemoria
let registrar: RegistrarInstrucaoUseCase

beforeEach(async () => {
  instrucoes = new InstrucaoRepositoryEmMemoria()
  membros = new MembroRepositoryEmMemoria()
  registrar = new RegistrarInstrucaoUseCase({
    instrucoes,
    membros,
    geradorDeId: new GeradorDeIdFake(),
    agora: () => AGORA,
  })

  await membros.salvar(
    Membro.cadastrar({
      id: MEMBRO_ID,
      nome: 'Marcelo Rodrigo',
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: new Date('2026-01-01'),
      quando: new Date('2026-01-01'),
    }),
  )
})

describe('RegistrarInstrucaoUseCase', () => {
  it('editor registra a instrução carimbando autor e momento', async () => {
    const instrucao = await registrar.executar(editor(), dadosValidos)

    expect(instrucao.registradoPor).toBe(editor().id)
    expect(instrucao.registradoEm).toEqual(AGORA)
    expect(instrucao.foiAlterada).toBe(false)
  })

  it('leitor não registra', async () => {
    await expect(registrar.executar(leitor(), dadosValidos)).rejects.toThrow(
      PermissaoNegadaError,
    )

    expect(instrucoes.salvos.size).toBe(0)
  })

  it('recusa registro para membro inexistente', async () => {
    await expect(
      registrar.executar(editor(), { ...dadosValidos, membroId: 'fantasma' }),
    ).rejects.toThrow(DomainError)
  })

  it('recusa a mesma instrução duas vezes — corrigir é ato do Admin', async () => {
    await registrar.executar(editor(), dadosValidos)

    await expect(registrar.executar(admin(), dadosValidos)).rejects.toThrow(
      DomainError,
    )
    expect(instrucoes.salvos.size).toBe(1)
  })

  it('aceita outro número do mesmo grau', async () => {
    await registrar.executar(editor(), dadosValidos)

    await registrar.executar(editor(), { ...dadosValidos, numero: 2 })

    expect(instrucoes.salvos.size).toBe(2)
  })

  it('recusa número fora do intervalo do grau', async () => {
    await expect(
      registrar.executar(editor(), { ...dadosValidos, numero: 8 }),
    ).rejects.toThrow(DomainError)
  })
})
