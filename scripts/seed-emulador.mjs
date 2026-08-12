// Popula os emuladores com contas de cada papel e alguns membros/instruções,
// para haver o que ver na tela já no primeiro login.
//
//   firebase emulators:start --only firestore,auth --project demo-loja
//   yarn seed
//
// Escreve no Firestore com o header `Authorization: Bearer owner`, modo em que
// a REST API do emulador ignora as Security Rules. É o único jeito de criar o
// primeiro Admin: a rule proíbe autopromoção de propósito, então não existe
// caminho pela UI. Em produção o equivalente é editar `usuarios/{uid}` na
// Console do Firebase, uma vez.
//
// Idempotente: rodar de novo reaproveita as contas existentes. Nunca aponte
// para um projeto real — isto é só para emulador.

const PROJETO = process.env.SEED_PROJECT_ID ?? 'demo-loja'
const HOST = process.env.SEED_EMULATOR_HOST ?? '127.0.0.1'
const PORTA_FIRESTORE = process.env.SEED_FIRESTORE_PORT ?? '8080'
const PORTA_AUTH = process.env.SEED_AUTH_PORT ?? '9099'
const SENHA = 'senha123'

const identityToolkit = `http://${HOST}:${PORTA_AUTH}/identitytoolkit.googleapis.com/v1`
const CRIAR_CONTA = `${identityToolkit}/accounts:signUp?key=demo-api-key`
const ENTRAR = `${identityToolkit}/accounts:signInWithPassword?key=demo-api-key`
const FIRESTORE = `http://${HOST}:${PORTA_FIRESTORE}/v1/projects/${PROJETO}/databases/(default)/documents`

const CONTAS = [
  { email: 'admin@loja.test', nome: 'Ana Admin', papel: 'admin' },
  { email: 'editor@loja.test', nome: 'Edu Editor', papel: 'editor' },
  { email: 'leitor@loja.test', nome: 'Léo Leitor', papel: 'leitor' },
]

// `instrucoes` é quantas instruções o membro já recebeu, distribuídas na ordem
// canônica dos graus — dá três estados diferentes de progresso no painel.
const MEMBROS = [
  { id: 'membro-1', nome: 'Carlos Aprendiz', grauAtual: 'aprendiz', iniciacao: [2026, 3, 10], instrucoes: 4 },
  { id: 'membro-2', nome: 'Bruno Companheiro', grauAtual: 'companheiro', iniciacao: [2024, 6, 5], instrucoes: 9 },
  { id: 'membro-3', nome: 'Daniel Mestre', grauAtual: 'mestre', iniciacao: [2022, 9, 20], instrucoes: 13 },
]

/** Espelha TOTAL_DE_INSTRUCOES de `src/domain/enums/Grau.ts`. */
const CATALOGO = [
  ['aprendiz', 7],
  ['companheiro', 5],
  ['mestre', 3],
]

// Meio-dia local: `new Date('2026-03-10')` é meia-noite UTC e retrocede um dia
// em fuso negativo. Mesma regra de `src/presentation/datas.ts`.
const meioDiaLocal = (ano, mes, dia) => new Date(ano, mes - 1, dia, 12).toISOString()
const agora = new Date().toISOString()

const texto = (valor) => ({ stringValue: valor })
const carimbo = (valor) => ({ timestampValue: valor })
const inteiro = (valor) => ({ integerValue: String(valor) })
const booleano = (valor) => ({ booleanValue: valor })
const nulo = { nullValue: null }

async function postar(url, corpo, cabecalhos = {}) {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cabecalhos },
    body: JSON.stringify(corpo),
  })
  return { ok: resposta.ok, dados: await resposta.json() }
}

/** Conta que já existe é reaproveitada pelo login — o Auth sobrevive ao clear do Firestore. */
async function garantirConta({ email, nome }) {
  const criacao = await postar(CRIAR_CONTA, {
    email,
    password: SENHA,
    displayName: nome,
    returnSecureToken: true,
  })
  if (criacao.ok) return criacao.dados.localId

  if (criacao.dados.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(`Auth ${email}: ${JSON.stringify(criacao.dados)}`)
  }

  const login = await postar(ENTRAR, { email, password: SENHA, returnSecureToken: true })
  if (!login.ok) throw new Error(`Login ${email}: ${JSON.stringify(login.dados)}`)
  return login.dados.localId
}

async function gravar(colecao, id, fields) {
  const resposta = await fetch(`${FIRESTORE}/${colecao}?documentId=${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields }),
  })
  // 409 = documento já existe: o seed roda de novo sem reclamar.
  if (!resposta.ok && resposta.status !== 409) {
    throw new Error(`Firestore ${colecao}/${id}: ${await resposta.text()}`)
  }
}

function instrucoesDe(membroId, quantas) {
  const lista = []
  let restam = quantas
  for (const [grau, total] of CATALOGO) {
    for (let numero = 1; numero <= total && restam > 0; numero++, restam--) {
      lista.push({ membroId, grau, numero })
    }
  }
  return lista
}

async function semear() {
  const uids = {}
  for (const conta of CONTAS) {
    const uid = await garantirConta(conta)
    uids[conta.papel] = uid
    await gravar('usuarios', uid, {
      nome: texto(conta.nome),
      email: texto(conta.email),
      papel: texto(conta.papel),
      criadoEm: carimbo(agora),
    })
    console.log(`conta ${conta.papel.padEnd(6)} ${conta.email}  uid=${uid}`)
  }

  let total = 0
  for (const membro of MEMBROS) {
    await gravar('membros', membro.id, {
      nome: texto(membro.nome),
      grauAtual: texto(membro.grauAtual),
      dataIniciacao: carimbo(meioDiaLocal(...membro.iniciacao)),
      ativo: booleano(true),
      criadoEm: carimbo(agora),
      atualizadoEm: carimbo(agora),
    })

    for (const instrucao of instrucoesDe(membro.id, membro.instrucoes)) {
      total += 1
      await gravar('instrucoes', `instrucao-${total}`, {
        membroId: texto(instrucao.membroId),
        grau: texto(instrucao.grau),
        numero: inteiro(instrucao.numero),
        dataRecebimento: carimbo(meioDiaLocal(2026, 5, 1 + (total % 28))),
        registradoPor: texto(uids.editor),
        registradoEm: carimbo(agora),
        alteradoPor: nulo,
        alteradoEm: nulo,
      })
    }
    console.log(`membro ${membro.nome} (${membro.instrucoes} instruções)`)
  }

  console.log(
    `\nOK: ${CONTAS.length} contas, ${MEMBROS.length} membros, ${total} instruções.` +
      `\nSenha de todas as contas: ${SENHA}`,
  )
}

semear().catch((erro) => {
  console.error(`\nFalhou: ${erro.message}`)
  console.error(
    `Os emuladores estão no ar em ${HOST}:${PORTA_FIRESTORE} (Firestore) e ${HOST}:${PORTA_AUTH} (Auth)?`,
  )
  process.exit(1)
})
