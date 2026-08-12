import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { FirestoreInstrucaoRepository } from '@/infrastructure/firebase/FirestoreInstrucaoRepository'
import { FirestoreMembroRepository } from '@/infrastructure/firebase/FirestoreMembroRepository'
import { FirestoreAuditoriaRepository } from '@/infrastructure/firebase/FirestoreAuditoriaRepository'
import { FirestoreUsuarioRepository } from '@/infrastructure/firebase/FirestoreUsuarioRepository'
import { RegistrarInstrucaoUseCase } from '@/application/useCases/RegistrarInstrucaoUseCase'
import { AlterarDataInstrucaoUseCase } from '@/application/useCases/AlterarDataInstrucaoUseCase'
import { ListarHistoricoDoMembroUseCase } from '@/application/useCases/ListarHistoricoDoMembroUseCase'
import { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { usuarioCom } from '@/test/fixtures/usuarios'
import { Grau } from '@/domain/enums/Grau'
import { Papel } from '@/domain/enums/Papel'

const PROJECT_ID = 'demo-loja-auditoria'
const MEMBRO_ID = 'membro-1'
const DATA_ORIGINAL = new Date(2026, 2, 10, 12)
const DATA_CORRIGIDA = new Date(2026, 2, 17, 12)
const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))

const editor = usuarioCom(Papel.EDITOR)
const admin = usuarioCom(Papel.ADMIN)

const dadosDaInstrucao = {
  membroId: MEMBRO_ID,
  grau: Grau.APRENDIZ,
  numero: 1,
  dataRecebimento: DATA_ORIGINAL,
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
    geradorDeId: new GeradorDeIdFake(),
  })
}

async function logsGravados(): Promise<number> {
  let total = 0
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const snapshot = await getDocs(collection(ctx.firestore(), 'auditoria'))
    total = snapshot.size
  })
  return total
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
        criadoEm: usuario.criadoEm,
      })
    }
    await setDoc(doc(db, 'membros', MEMBRO_ID), {
      nome: 'Marcelo Rodrigo',
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: DATA_ORIGINAL,
      ativo: true,
      criadoEm: DATA_ORIGINAL,
      atualizadoEm: DATA_ORIGINAL,
    })
  })
})

describe('Trilha de auditoria no writeBatch', () => {
  it('a correção do admin grava instrução e log no mesmo commit', async () => {
    const instrucao = await registrarComoEditor(bancoDe(editor.id)).executar(
      editor,
      dadosDaInstrucao,
    )
    const dbAdmin = bancoDe(admin.id)

    await alterarDataCom(dbAdmin).executar(admin, {
      instrucaoId: instrucao.id,
      novaData: DATA_CORRIGIDA,
    })

    const gravada = await new FirestoreInstrucaoRepository(dbAdmin).buscarPorId(
      instrucao.id,
    )
    const trilha = await new FirestoreAuditoriaRepository(
      dbAdmin,
    ).listarPorInstrucoes([instrucao.id])

    expect(gravada!.dataRecebimento).toEqual(DATA_CORRIGIDA)
    expect(trilha).toHaveLength(1)
    expect(new Date(trilha[0].valorAnterior)).toEqual(DATA_ORIGINAL)
    expect(new Date(trilha[0].valorNovo)).toEqual(DATA_CORRIGIDA)
    expect(trilha[0].alteradoPor).toBe(admin.id)
  })

  it('editor barrado pela rule não deixa nem a alteração nem o log', async () => {
    const dbEditor = bancoDe(editor.id)
    const instrucao = await registrarComoEditor(dbEditor).executar(
      editor,
      dadosDaInstrucao,
    )

    // Contorna a checagem de papel do caso de uso; sobra só a rule.
    const corrigidaPorFora = instrucao.alterarData(
      DATA_CORRIGIDA,
      editor.id,
      DATA_CORRIGIDA,
    )
    const logForjado = RegistroDeAuditoria.daAlteracaoDeData({
      id: 'log-forjado',
      instrucaoId: instrucao.id,
      dataAnterior: DATA_ORIGINAL,
      dataNova: DATA_CORRIGIDA,
      alteradoPor: editor.id,
      alteradoEm: DATA_CORRIGIDA,
    })

    await assertFails(
      new FirestoreInstrucaoRepository(dbEditor).salvarComAuditoria(
        corrigidaPorFora,
        logForjado,
      ),
    )

    const gravada = await new FirestoreInstrucaoRepository(
      dbEditor,
    ).buscarPorId(instrucao.id)
    expect(gravada!.dataRecebimento).toEqual(DATA_ORIGINAL)
    expect(await logsGravados()).toBe(0)
  })

  it('a trilha é append-only: nem o admin reescreve um log', async () => {
    const instrucao = await registrarComoEditor(bancoDe(editor.id)).executar(
      editor,
      dadosDaInstrucao,
    )
    const dbAdmin = bancoDe(admin.id)
    await alterarDataCom(dbAdmin).executar(admin, {
      instrucaoId: instrucao.id,
      novaData: DATA_CORRIGIDA,
    })

    const [log] = await new FirestoreAuditoriaRepository(
      dbAdmin,
    ).listarPorInstrucoes([instrucao.id])
    const ref = doc(dbAdmin, 'auditoria', log.id)

    await assertFails(updateDoc(ref, { valorAnterior: 'reescrito' }))
    await assertFails(deleteDoc(ref))
  })

  it('o histórico do membro mostra quem corrigiu, pelo nome', async () => {
    const instrucao = await registrarComoEditor(bancoDe(editor.id)).executar(
      editor,
      dadosDaInstrucao,
    )
    const dbAdmin = bancoDe(admin.id)
    await alterarDataCom(dbAdmin).executar(admin, {
      instrucaoId: instrucao.id,
      novaData: DATA_CORRIGIDA,
    })

    const alteracoes = await new ListarHistoricoDoMembroUseCase({
      instrucoes: new FirestoreInstrucaoRepository(dbAdmin),
      auditoria: new FirestoreAuditoriaRepository(dbAdmin),
      usuarios: new FirestoreUsuarioRepository(dbAdmin),
    }).executar(MEMBRO_ID)

    expect(alteracoes).toHaveLength(1)
    expect(alteracoes[0].autor).toBe(admin.nome)
    expect(alteracoes[0].instrucao.numero).toBe(1)
  })
})
