# Contribuindo com o Controle de Instruções

Obrigado pelo interesse em contribuir! Este guia resume o fluxo de trabalho e
as convenções do projeto.

## Antes de começar

- Procure uma [issue](https://github.com/marcelofilipov/regua-instrucoes/issues)
  aberta ou abra uma descrevendo o que pretende fazer, para evitar trabalho
  duplicado.
- Para mudanças grandes, comente na issue e alinhe a abordagem antes de codar.

## Ambiente de desenvolvimento

Requisitos: Node.js 20+, **Yarn Classic 1.22** e Firebase CLI.

O gerenciador de pacotes é o Yarn — use `yarn`, nunca `npm`. O lockfile
versionado é o `yarn.lock`.

```bash
yarn install
cp .env.example .env.local
firebase emulators:start --only firestore,auth --project demo-loja
yarn dev
```

Não é preciso ter um projeto Firebase próprio para desenvolver: com
`VITE_USE_FIREBASE_EMULATOR=true` no `.env.local`, as credenciais podem ser
fictícias e tudo roda contra os emuladores. Veja o
[README](./README.md#rodando-localmente) para o passo a passo completo,
inclusive o script que popula o banco local com dados de teste.

## Fluxo de branches

- A branch de integração é a **`main`** (este projeto não tem `develop`).
- Crie sua branch a partir da `main`:
  `git checkout main && git pull && git checkout -b feat/minha-mudanca`.
- Prefixos: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
- Toda alteração entra na `main` **via Pull Request**, com **merge commit**
  (não squash) — não faça push direto.

## Antes de abrir o PR

Rode a verificação completa e garanta que passa:

```bash
yarn test           # testes unitários (Vitest + Testing Library)
yarn test:emulator  # testes de regras e repositórios no Firebase Emulator
yarn lint           # oxlint
yarn build          # tsc -b + build de produção
```

Não há CI configurado ainda: a validação é local, e é responsabilidade de quem
abre o PR.

## Convenções de código

O projeto segue arquitetura em camadas e princípios de Código Limpo. Respeite a
separação:

```
src/domain/          entidades, enums, portas de repositório — sem dependência
                     de framework nem de Firebase
src/application/     casos de uso, orquestrando o domínio sobre as portas
src/infrastructure/  implementações Firestore das portas, mappers
src/presentation/    React: páginas, componentes, hooks
src/composition/     raiz de composição — o único lugar que monta as
                     dependências concretas
```

Pontos que costumam derrubar PR aqui:

- **Nada de importar Firebase dentro da árvore React.** Os serviços chegam por
  prop/contexto a partir da raiz de composição. É isso que mantém os testes de
  tela rodando sem Firebase.
- **Toda permissão precisa estar na Security Rule, não só na UI.** Esconder um
  botão é cosmético; quem garante é o `firestore.rules`. Se você adicionar uma
  regra de permissão, adicione o teste de emulador correspondente.
- **`erasableSyntaxOnly` está ativo**: não use `enum` do TypeScript (modele com
  objeto `as const` + union type) nem *parameter properties* no construtor.
- **Datas do `<input type="date">` passam por `presentation/datas.ts`** e viram
  meio-dia local. `new Date('2026-03-10')` é meia-noite UTC e retrocede um dia
  em fuso negativo — inclusive em fixtures de teste.
- Comente decisões não óbvias, seguindo a densidade de comentários do código ao
  redor. Comentário que repete o código é ruído.

## Pull Request

- Descreva **o quê** e **por quê**, e como testou.
- Referencie a issue relacionada (`Closes #123`).
- PRs pequenos e focados são revisados mais rápido.

## Reportando bugs e segurança

- Bugs comuns: abra uma issue com passos para reproduzir.
- **Vulnerabilidades de segurança: não abra issue pública** — siga o
  [`SECURITY.md`](./SECURITY.md).

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob a
[AGPL-3.0](./LICENSE), a mesma licença do projeto.
