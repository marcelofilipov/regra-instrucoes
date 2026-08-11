import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, type Firestore } from 'firebase/firestore'
import { FirestoreInstrucaoRepository } from '@/infrastructure/firebase/FirestoreInstrucaoRepository'
import { FirestoreMembroRepository } from '@/infrastructure/firebase/FirestoreMembroRepository'
import { RegistrarInstrucaoUseCase } from '@/application/useCases/RegistrarInstrucaoUseCase'
import { AlterarDataInstrucaoUseCase } from '@/application/useCases/AlterarDataInstrucaoUseCase'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { usuarioCom } from '@/test/fixtures/usuarios'
import { Grau } from '@/domain/enums/Grau'
import { Papel } from '@/domain/enums/Papel'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

const PROJECT_ID = 'demo-loja-instrucoes'
const MEMBRO_ID = 'membro-1'
const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))

const editor = usuarioCom(Papel.EDITOR)
const admin = usuarioCom(Papel.ADMIN)

const dadosDaInstrucao = {
  membroId: MEMBRO_ID,
  grau: Grau.APRENDIZ,
  numero: 1,
  dataRecebimento: new Date('2026-03-10'),
}

let testEnv: RulesTestEnvironment

function bancoDe(usuarioId: string): Firestore {
  return testEnv.authenticatedContext(usuarioId).firestore() as unknown as Firestore
}

function registrarComoEditor(db: Firestore): RegistrarInstrucaoUseCase {
  return new RegistrarInstrucaoUseCase({
    instrucoes: new FirestoreInstrucaoRepository(db),
    membros: new FirestoreMembroRepository(db),
    geradorDeId: new GeradorDeIdFake(),
  })
}

function alterarDataCom(db: Firestore): AlterarDataInstrucaoUseCase {
  return new AlterarDataInstrucaoUseCase({
    instrucoes: new FirestoreInstrucaoRepository(db),
  })
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(rulesPath, 'utf8') },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    for (const usuario of [editor, admin]) {
      await setDoc(doc(db, 'usuarios', usuario.id), {
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      })
    }
    await setDoc(doc(db, 'membros', MEMBRO_ID), {
      nome: 'Marcelo Rodrigo',
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: new Date('2026-01-01'),
      ativo: true,
      criadoEm: new Date('2026-01-01'),
      atualizadoEm: new Date('2026-01-01'),
    })
  })
})

describe('Dupla trava: caso de uso + Security Rule', () => {
  it('editor registra a instrução pela 1ª vez', async () => {
    const db = bancoDe(editor.id)

    const instrucao = await registrarComoEditor(db).executar(
      editor,
      dadosDaInstrucao,
    )

    const gravada = await new FirestoreInstrucaoRepository(db).buscarPorId(
      instrucao.id,
    )
    expect(gravada!.dataRecebimento).toEqual(dadosDaInstrucao.dataRecebimento)
  })

  it('o caso de uso recusa o editor que tenta corrigir a data', async () => {
    const db = bancoDe(editor.id)
    const instrucao = await registrarComoEditor(db).executar(
      editor,
      dadosDaInstrucao,
    )

    await expect(
      alterarDataCom(db).executar(editor, {
        instrucaoId: instrucao.id,
        novaData: new Date('2026-03-17'),
      }),
    ).rejects.toThrow(PermissaoNegadaError)
  })

  it('a rule recusa o editor mesmo contornando o caso de uso', async () => {
    const db = bancoDe(editor.id)
    const repositorio = new FirestoreInstrucaoRepository(db)
    const instrucao = await registrarComoEditor(db).executar(
      editor,
      dadosDaInstrucao,
    )

    const corrigidaPorFora = instrucao.alterarData(
      new Date('2026-03-17'),
      editor.id,
      new Date('2026-03-17'),
    )

    await assertFails(repositorio.salvar(corrigidaPorFora))
  })

  it('admin corrige a data e o banco aceita', async () => {
    const instrucao = await registrarComoEditor(bancoDe(editor.id)).executar(
      editor,
      dadosDaInstrucao,
    )
    const dbAdmin = bancoDe(admin.id)

    await alterarDataCom(dbAdmin).executar(admin, {
      instrucaoId: instrucao.id,
      novaData: new Date('2026-03-17'),
    })

    const gravada = await new FirestoreInstrucaoRepository(dbAdmin).buscarPorId(
      instrucao.id,
    )
    expect(gravada!.dataRecebimento).toEqual(new Date('2026-03-17'))
    expect(gravada!.alteradoPor).toBe(admin.id)
  })

  it('o membro precisa existir para a instrução ser registrada', async () => {
    const db = bancoDe(editor.id)

    await expect(
      registrarComoEditor(db).executar(editor, {
        ...dadosDaInstrucao,
        membroId: 'fantasma',
      }),
    ).rejects.toThrow()
  })
})
