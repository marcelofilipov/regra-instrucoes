import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

const PROJECT_ID = 'demo-loja'
const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))

let testEnv: RulesTestEnvironment

/** Semeia um usuário com determinado papel, ignorando as regras (setup). */
async function semearUsuario(uid: string, papel: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'usuarios', uid), {
      nome: uid,
      email: `${uid}@loja.test`,
      papel,
    })
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
  await semearUsuario('leitor-1', 'leitor')
  await semearUsuario('editor-1', 'editor')
  await semearUsuario('admin-1', 'admin')
})

describe('Security Rules — instrucoes', () => {
  const dadosInstrucao = {
    membroId: 'membro-1',
    grau: 'aprendiz',
    numero: 1,
    dataRecebimento: new Date(),
    registradoPor: 'editor-1',
    registradoEm: new Date(),
    alteradoPor: null,
    alteradoEm: null,
  }

  it('não autenticado não lê', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'instrucoes', 'x')))
  })

  it('leitor lê mas não cria', async () => {
    const db = testEnv.authenticatedContext('leitor-1').firestore()
    await assertSucceeds(getDoc(doc(db, 'instrucoes', 'x')))
    await assertFails(setDoc(doc(db, 'instrucoes', 'i1'), dadosInstrucao))
  })

  it('editor cria (1ª vez) mas não altera', async () => {
    const db = testEnv.authenticatedContext('editor-1').firestore()
    await assertSucceeds(setDoc(doc(db, 'instrucoes', 'i1'), dadosInstrucao))
    await assertFails(
      updateDoc(doc(db, 'instrucoes', 'i1'), { dataRecebimento: new Date() }),
    )
  })

  it('admin altera e exclui', async () => {
    const editorDb = testEnv.authenticatedContext('editor-1').firestore()
    await setDoc(doc(editorDb, 'instrucoes', 'i1'), dadosInstrucao)

    const adminDb = testEnv.authenticatedContext('admin-1').firestore()
    await assertSucceeds(
      updateDoc(doc(adminDb, 'instrucoes', 'i1'), { alteradoPor: 'admin-1' }),
    )
    await assertSucceeds(deleteDoc(doc(adminDb, 'instrucoes', 'i1')))
  })
})

describe('Security Rules — usuarios (anti-autopromoção)', () => {
  it('novo usuário só cria o próprio doc como leitor', async () => {
    const db = testEnv.authenticatedContext('novato').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'usuarios', 'novato'), {
        nome: 'Novato',
        email: 'n@loja.test',
        papel: 'leitor',
      }),
    )
  })

  it('não pode se cadastrar já como admin', async () => {
    const db = testEnv.authenticatedContext('esperto').firestore()
    await assertFails(
      setDoc(doc(db, 'usuarios', 'esperto'), {
        nome: 'Esperto',
        email: 'e@loja.test',
        papel: 'admin',
      }),
    )
  })

  it('não pode criar doc de outro uid', async () => {
    const db = testEnv.authenticatedContext('alguem').firestore()
    await assertFails(
      setDoc(doc(db, 'usuarios', 'outro'), {
        nome: 'Outro',
        email: 'o@loja.test',
        papel: 'leitor',
      }),
    )
  })

  it('só admin altera papel de terceiros', async () => {
    const editorDb = testEnv.authenticatedContext('editor-1').firestore()
    await assertFails(
      updateDoc(doc(editorDb, 'usuarios', 'leitor-1'), { papel: 'admin' }),
    )
    const adminDb = testEnv.authenticatedContext('admin-1').firestore()
    await assertSucceeds(
      updateDoc(doc(adminDb, 'usuarios', 'leitor-1'), { papel: 'editor' }),
    )
  })
})

describe('Security Rules — membros e auditoria', () => {
  it('editor cadastra membro, mas só admin exclui', async () => {
    const editorDb = testEnv.authenticatedContext('editor-1').firestore()
    await assertSucceeds(
      setDoc(doc(editorDb, 'membros', 'm1'), {
        nome: 'Marcelo',
        grauAtual: 'aprendiz',
        ativo: true,
      }),
    )
    await assertFails(deleteDoc(doc(editorDb, 'membros', 'm1')))

    const adminDb = testEnv.authenticatedContext('admin-1').firestore()
    await assertSucceeds(deleteDoc(doc(adminDb, 'membros', 'm1')))
  })

  it('auditoria: só admin grava e ninguém edita/apaga', async () => {
    const editorDb = testEnv.authenticatedContext('editor-1').firestore()
    await assertFails(
      setDoc(doc(editorDb, 'auditoria', 'l1'), { campoAlterado: 'x' }),
    )

    const adminDb = testEnv.authenticatedContext('admin-1').firestore()
    await assertSucceeds(
      setDoc(doc(adminDb, 'auditoria', 'l1'), { campoAlterado: 'x' }),
    )
    await assertFails(deleteDoc(doc(adminDb, 'auditoria', 'l1')))
  })
})
