# Política de Segurança

## Reportando uma vulnerabilidade

**Não abra uma issue pública para vulnerabilidades de segurança.** Como este
projeto lida com dados de membros de uma Loja, a divulgação responsável é
importante.

Prefira um dos canais privados:

1. **GitHub Security Advisories** (recomendado): aba **Security** →
   **Report a vulnerability** neste repositório. Isso mantém o relato privado
   até a correção.
2. **E-mail**: marcelo.filipov@gmail.com com o assunto
   `[SECURITY] Controle de Instruções`.

Inclua, se possível:

- Descrição da vulnerabilidade e do impacto.
- Passos para reproduzir (ou prova de conceito).
- Versão/commit afetado.

## O que esperar

- Confirmação de recebimento em até **72 horas**.
- Avaliação e, quando aplicável, correção priorizada.
- Crédito ao pesquisador na divulgação, se desejado.

## Escopo

Atenção especial a:

- **`firestore.rules`** — é onde as travas de fato valem. O modelo é
  deny-by-default, com papéis `admin`/`editor`/`leitor` lidos do próprio
  Firestore (sem Custom Claims, que exigiriam Cloud Functions e plano Blaze).
- **A trava de correção de data**: uma vez gravada, a data de uma instrução só
  pode ser alterada por Admin. Qualquer caminho que permita a um Editor ou
  Leitor alterá-la — inclusive contornando a UI e chamando o SDK direto — é
  vulnerabilidade.
- **Autopromoção de papel**: um usuário nasce `leitor` e só um Admin pode
  promovê-lo. Qualquer forma de se autopromover é vulnerabilidade.
- **Trilha de auditoria append-only**: `auditoria/` não aceita `update` nem
  `delete` de ninguém, nem de Admin. Qualquer forma de reescrever ou apagar uma
  linha da trilha é vulnerabilidade.
- Exposição de dados de membros (LGPD).

## Fora do escopo

- **Leitura dos dados da Loja por qualquer usuário autenticado é intencional**,
  não vulnerabilidade: todos os membros enxergam o progresso uns dos outros, a
  trilha de auditoria e a lista de usuários. As restrições de papel existem
  sobre a **escrita**. Se isso mudar, muda primeiro no `firestore.rules`.
- Configuração local mal ajustada (ex.: credenciais fracas ou emuladores
  expostos no seu próprio ambiente de desenvolvimento).
