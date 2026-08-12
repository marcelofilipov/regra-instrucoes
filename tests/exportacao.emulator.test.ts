import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, type Firestore } from 'firebase/firestore'
import { FirestoreInstrucaoRepository } from '@/infrastructure/firebase/FirestoreInstrucaoRepository'
import { FirestoreMembroRepository } from '@/infrastructure/firebase/FirestoreMembroRepository'
import { FirestoreAuditoriaRepository } from '@/infrastructure/firebase/FirestoreAuditoriaRepository'
import { FirestoreUsuarioRepository } from '@/infrastructure/firebase/FirestoreUsuarioRepository'
import { RegistrarInstrucaoUseCase } from '@/application/useCases/RegistrarInstrucaoUseCase'
import { AlterarDataInstrucaoUseCase } from '@/application/useCases/AlterarDataInstrucaoUseCase'
import { ExportarDadosUseCase } from '@/application/useCases/ExportarDadosUseCase'
import { paraArquivosCsv, paraJson } from '@/application/exportacao/serializadores'
import { GeradorDeIdFake } from '@/test/fakes/GeradorDeIdFake'
import { usuarioCom } from '@/test/fixtures/usuarios'
import { Grau } from '@/domain/enums/Grau'
import { Papel } from '@/domain/enums/Papel'

const PROJECT_ID = 'demo-loja-exportacao'
const MEMBRO_ID = 'membro-1'
const DATA_ORIGINAL = new Date(2026, 2, 10, 12)
const DATA_CORRIGIDA = new Date(2026, 2, 17, 12)
const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))

const editor = usuarioCom(Papel.EDITOR)
const admin = usuarioCom(Papel.ADMIN)

let testEnv: RulesTestEnvironment

function bancoDe(usuarioId: string): Firestore {
  return testEnv.authenticatedContext(usuarioId).firestore() as unknown as Firestore
}

function exportarCom(db: Firestore): ExportarDadosUseCase {
  return new ExportarDadosUseCase({
    membros: new FirestoreMembroRepository(db),
    instrucoes: new FirestoreInstrucaoRepository(db),
    auditoria: new FirestoreAuditoriaRepository(db),
    usuarios: new FirestoreUsuarioRepository(db),
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

  const instrucao = await new RegistrarInstrucaoUseCase({
    instrucoes: new FirestoreInstrucaoRepository(bancoDe(editor.id)),
    membros: new FirestoreMembroRepository(bancoDe(editor.id)),
    geradorDeId: new GeradorDeIdFake(),
  }).executar(editor, {
    membroId: MEMBRO_ID,
    grau: Grau.APRENDIZ,
    numero: 1,
    dataRecebimento: DATA_ORIGINAL,
  })

  await new AlterarDataInstrucaoUseCase({
    instrucoes: new FirestoreInstrucaoRepository(bancoDe(admin.id)),
    geradorDeId: new GeradorDeIdFake(),
  }).executar(admin, { instrucaoId: instrucao.id, novaData: DATA_CORRIGIDA })
})

describe('Exportação contra o banco real', () => {
  it('o admin lê as quatro coleções — nenhuma rule barra a cópia', async () => {
    const snapshot = await exportarCom(bancoDe(admin.id)).executar(admin)

    expect(snapshot.membros).toHaveLength(1)
    expect(snapshot.instrucoes).toHaveLength(1)
    expect(snapshot.usuarios).toHaveLength(2)
    expect(snapshot.auditoria).toHaveLength(1)
  })

  it('o JSON exportado carrega a correção e a trilha que a explica', async () => {
    const snapshot = await exportarCom(bancoDe(admin.id)).executar(admin)
    const conteudo = JSON.parse(paraJson(snapshot).conteudo)

    expect(new Date(conteudo.instrucoes[0].dataRecebimento)).toEqual(
      DATA_CORRIGIDA,
    )
    expect(new Date(conteudo.auditoria[0].valorAnterior)).toEqual(DATA_ORIGINAL)
    expect(conteudo.auditoria[0].alteradoPor).toBe(admin.id)
  })

  it('sai uma planilha por coleção, com linha de dado além do cabeçalho', async () => {
    const snapshot = await exportarCom(bancoDe(admin.id)).executar(admin)
    const arquivos = paraArquivosCsv(snapshot)

    expect(arquivos).toHaveLength(4)
    for (const arquivo of arquivos) {
      const linhas = arquivo.conteudo.split('\r\n').filter(Boolean)
      expect(linhas.length).toBeGreaterThan(1)
    }
  })
})
