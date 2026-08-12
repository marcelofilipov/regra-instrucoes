# Controle de Instruções

Controle das instruções recebidas pelos membros de uma Loja Maçônica, por grau e
com histórico de progressão.

[![Licença: AGPL v3](https://img.shields.io/badge/Licen%C3%A7a-AGPL%20v3-blue.svg)](./LICENSE)

Cada membro percorre uma sequência fixa de instruções em cada grau — 7 no
Aprendiz, 5 no Companheiro, 3 no Mestre. O app registra quando cada uma foi
recebida, mostra o progresso e mantém uma trilha de auditoria de toda correção
de data.

## A regra que organiza o resto

Uma vez que a data de uma instrução é gravada, **só o Admin pode alterá-la**.
Editor cadastra, não corrige. Essa trava vive no `firestore.rules`, não apenas
na interface: esconder botão é cosmético, não é controle de acesso. Toda
correção grava, na mesma escrita atômica, uma linha em `auditoria/` — que é
append-only para todo mundo, inclusive para o Admin.

## Papéis

| Papel | Pode |
|---|---|
| **Leitor** | ver membros, progresso e trilha de auditoria |
| **Editor** | tudo do Leitor + cadastrar membro e registrar instrução pela 1ª vez |
| **Admin** | tudo do Editor + corrigir data já gravada, excluir, gerir papéis e exportar dados |

Todo usuário nasce `leitor`. A promoção é ato de um Admin — ninguém se
autopromove, e isso também está na Security Rule.

## Stack

- Vite + React 19 + TypeScript (strict, com `erasableSyntaxOnly`)
- Tailwind CSS v4 via `@tailwindcss/vite`
- React Router v7, TanStack Query v5, react-hook-form + zod
- Firebase SDK 12 (Auth + Firestore) — **plano Spark, sem Cloud Functions**
- Vitest + Testing Library; regras testadas no Firebase Emulator Suite
- oxlint; **Yarn Classic 1.22** como gerenciador de pacotes

## Arquitetura

Camadas, com o domínio no centro e sem dependência de framework:

```
src/domain/          entidades, enums, portas de repositório — sem Firebase,
                     sem React
src/application/     casos de uso, orquestrando o domínio sobre as portas
src/infrastructure/  implementações Firestore das portas, mappers Timestamp↔Date
src/presentation/    React: páginas, componentes, hooks
src/composition/     raiz de composição — o único lugar que monta as
                     dependências concretas
```

Nada de Firebase é importado dentro da árvore React: os serviços chegam por
prop a partir da raiz de composição. É isso que permite testar as telas com os
casos de uso **reais** sobre repositórios em memória, sem subir Firebase.

## Requisitos

- Node.js 20+
- Yarn Classic 1.22 (`corepack enable`)
- Firebase CLI (`npm i -g firebase-tools`) para os emuladores

## Rodando localmente

Não é preciso ter um projeto Firebase para desenvolver — tudo roda nos
emuladores, com credenciais fictícias.

```bash
yarn install
cp .env.example .env.local
```

No `.env.local`, deixe `VITE_USE_FIREBASE_EMULATOR=true` e
`VITE_FIREBASE_PROJECT_ID=demo-loja`; as demais variáveis podem ser valores de
faz-de-conta, porque o emulador não valida credencial.

Em um terminal, suba os emuladores:

```bash
firebase emulators:start --only firestore,auth --project demo-loja
```

Em outro, popule o banco e suba o app:

```bash
yarn seed   # cria contas de teste + membros com progresso variado
yarn dev
```

O app fica em <http://localhost:5173> e a UI dos emuladores em
<http://127.0.0.1:4000>. As contas criadas pelo seed usam a senha `senha123`:

| Login | Papel |
|---|---|
| `admin@loja.test` | admin |
| `editor@loja.test` | editor |
| `leitor@loja.test` | leitor |

O seed escreve direto no emulador, contornando as rules, porque **é o único
jeito de existir um primeiro Admin** — a rule proíbe autopromoção de propósito.
Em produção, o equivalente é editar `usuarios/{uid}` na Console do Firebase,
uma vez.

### Acessando de outra máquina

Se você desenvolve numa máquina remota via SSH, encaminhe as portas do app e
dos emuladores — o navegador precisa alcançar os três:

```bash
ssh -N -L 5173:127.0.0.1:5173 -L 8080:127.0.0.1:8080 -L 9099:127.0.0.1:9099 usuario@host
```

Se alguma porta local estiver ocupada, mapeie para outra e informe ao app com
`VITE_FIREBASE_EMULATOR_HOST`, `VITE_FIRESTORE_EMULATOR_PORT` e
`VITE_AUTH_EMULATOR_PORT` no `.env.local`.

## Verificação

```bash
yarn test           # testes unitários
yarn test:emulator  # regras e repositórios no Firebase Emulator
yarn lint
yarn build
```

`yarn test:emulator` sobe a própria instância de emulador (`firebase.test.json`,
Firestore na 8085), então pode rodar em paralelo ao ambiente de desenvolvimento
sem apagar os dados locais.

## Status

- [x] Fase 0–1 — fundação e domínio (entidades, enums, portas, testes puros)
- [x] Fase 2 — repositórios Firestore, Security Rules e testes no emulador
- [x] Fase 3 — autenticação, papel padrão `leitor`, rota protegida
- [x] Fase 4 — casos de uso críticos com dupla trava (caso de uso + rule)
- [x] Fase 5 — interface CRUD e painel de progresso
- [x] Fase 6 — trilha de auditoria gravada no mesmo `writeBatch` da alteração
- [x] Fase 6.1 — exportação manual dos dados (JSON e CSV) para o Admin
- [x] Fase 7 — paleta aplicada, mobile-first, contraste WCAG AA
- [ ] Fase 8 — projeto Firebase em produção, deploy no Hosting, checklist final

Até aqui o projeto roda **inteiramente em emulador**: ainda não existe projeto
Firebase na nuvem. Criá-lo é trabalho da Fase 8.

## Restrições do plano Spark

O projeto roda sem billing, o que define escolhas de arquitetura e não só de
custo:

- **Sem Cloud Functions**, logo sem Custom Claims — o papel é lido do próprio
  Firestore dentro da rule.
- **Sem trigger de banco**, logo a auditoria é gravada pelo cliente, no mesmo
  `writeBatch` da alteração. A porta de auditoria é só de leitura justamente
  para que não exista caminho que grave a alteração e esqueça o log.
- **Sem exportação agendada**, logo o botão "Exportar dados" do Admin é a rede
  de segurança contra exclusão acidental.

## Como contribuir

Veja o [`CONTRIBUTING.md`](./CONTRIBUTING.md) para o fluxo de branches, padrões
de código e checklist de PR. Ao participar, você concorda com o
[Código de Conduta](./CODE_OF_CONDUCT.md). Para relatar vulnerabilidades, siga
o [`SECURITY.md`](./SECURITY.md).

## Licença

Distribuído sob a licença **GNU Affero General Public License v3.0** — ver
[`LICENSE`](./LICENSE). A AGPL-3.0 é copyleft e cobre uso em rede: se você rodar
uma versão modificada como serviço, precisa disponibilizar o código-fonte
correspondente aos usuários.

© 2026 Marcelo Filipov.
