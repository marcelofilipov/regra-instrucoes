import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { type Firestore } from 'firebase/firestore'
import { FirestoreUsuarioRepository } from '@/infrastructure/firebase/FirestoreUsuarioRepository'
import { Usuario } from '@/domain/entities/Usuario'
import { Papel } from '@/domain/enums/Papel'

const PROJECT_ID = 'demo-loja-usuarios'
const UID = 'uid-novo'
const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))

let testEnv: RulesTestEnvironment
let db: Firestore

function perfilNovo(id = UID): Usuario {
  return Usuario.registrar({
    id,
    nome: 'Novo Irmão',
    email: 'novo@loja.test',
    quando: new Date('2026-08-11'),
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
  db = testEnv.authenticatedContext(UID).firestore() as unknown as Firestore
})

describe('FirestoreUsuarioRepository sob as Security Rules', () => {
  it('grava o próprio perfil de leitor no primeiro acesso', async () => {
    const repo = new FirestoreUsuarioRepository(db)

    await assertSucceeds(repo.salvar(perfilNovo()))
    const recuperado = await repo.buscarPorId(UID)

    expect(recuperado).not.toBeNull()
    expect(recuperado!.papel).toBe(Papel.LEITOR)
    expect(recuperado!.criadoEm).toBeInstanceOf(Date)
  })

  it('a regra recusa o perfil que tenta nascer admin', async () => {
    const repo = new FirestoreUsuarioRepository(db)

    await assertFails(repo.salvar(perfilNovo().comPapel(Papel.ADMIN)))
  })

  it('a regra recusa criar perfil de outro uid', async () => {
    const repo = new FirestoreUsuarioRepository(db)

    await assertFails(repo.salvar(perfilNovo('uid-de-outro')))
  })

  it('buscarPorId devolve null quando o perfil não existe', async () => {
    const repo = new FirestoreUsuarioRepository(db)

    expect(await repo.buscarPorId('inexistente')).toBeNull()
  })
})
