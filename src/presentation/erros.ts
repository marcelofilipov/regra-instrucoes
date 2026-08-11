const MENSAGEM_GENERICA = 'Algo deu errado. Tente novamente.'

/**
 * Extrai a mensagem exibível de um erro. `AutenticacaoError` e `DomainError` já
 * chegam com texto de usuário; qualquer outra coisa vira mensagem genérica,
 * para não vazar detalhe técnico na tela.
 */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error && erro.message.trim().length > 0) {
    return erro.message
  }
  return MENSAGEM_GENERICA
}
