import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, type Firestore } from 'firebase/firestore'
import { FirestoreMembroRepository } from '@/infrastructure/firebase/FirestoreMembroRepository'
import { FirestoreInstrucaoRepository } from '@/infrastructure/firebase/FirestoreInstrucaoRepository'
import { Membro } from '@/domain/entities/Membro'
import { Instrucao } from '@/domain/entities/Instrucao'
import { Grau } from '@/domain/enums/Grau'

const PROJECT_ID = 'demo-loja-repos'
const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))

let testEnv: RulesTestEnvironment
let db: Firestore

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
  // Um admin autenticado para os repositórios passarem pelas Security Rules.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'usuarios', 'admin-1'), {
      nome: 'admin',
      email: 'a@loja.test',
      papel: 'admin',
    })
  })
  db = testEnv.authenticatedContext('admin-1').firestore() as unknown as Firestore
})

describe('FirestoreMembroRepository', () => {
  it('salva e recupera preservando os tipos do domínio (Date, não Timestamp)', async () => {
    const repo = new FirestoreMembroRepository(db)
    const membro = Membro.cadastrar({
      id: 'm1',
      nome: 'Marcelo Rodrigo',
      grauAtual: Grau.APRENDIZ,
      dataIniciacao: new Date('2026-01-01'),
      quando: new Date('2026-01-01'),
    })

    await repo.salvar(membro)
    const recuperado = await repo.buscarPorId('m1')

    expect(recuperado).not.toBeNull()
    expect(recuperado!.nome).toBe('Marcelo Rodrigo')
    expect(recuperado!.dataIniciacao).toBeInstanceOf(Date)
    expect(recuperado!.criadoEm).toBeInstanceOf(Date)
  })

  it('buscarPorId devolve null quando não existe', async () => {
    const repo = new FirestoreMembroRepository(db)
    expect(await repo.buscarPorId('inexistente')).toBeNull()
  })
})

describe('FirestoreInstrucaoRepository', () => {
  it('lista por membro e por grau', async () => {
    const repo = new FirestoreInstrucaoRepository(db)
    await repo.salvar(
      Instrucao.registrar({
        id: 'i1',
        membroId: 'm1',
        grau: Grau.APRENDIZ,
        numero: 1,
        dataRecebimento: new Date('2026-01-10'),
        registradoPor: 'admin-1',
        registradoEm: new Date('2026-01-10'),
      }),
    )
    await repo.salvar(
      Instrucao.registrar({
        id: 'i2',
        membroId: 'm2',
        grau: Grau.APRENDIZ,
        numero: 1,
        dataRecebimento: new Date('2026-01-11'),
        registradoPor: 'admin-1',
        registradoEm: new Date('2026-01-11'),
      }),
    )

    expect(await repo.listarPorMembro('m1')).toHaveLength(1)
    expect(await repo.listarPorGrau(Grau.APRENDIZ)).toHaveLength(2)
    expect(await repo.listarPorGrau(Grau.MESTRE)).toHaveLength(0)
  })
})
