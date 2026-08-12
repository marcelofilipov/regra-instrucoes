/**
 * Classes compartilhadas dos controles.
 *
 * Existem para as decisões de contraste e de área de toque ficarem num lugar
 * só. Espalhadas por doze componentes, a próxima alteração esqueceria metade —
 * foi assim que o anel de foco dourado, que reprova na WCAG, sobreviveu até a
 * Fase 7.
 */

/**
 * Foco visível ao teclado. Marinho, não dourado: o dourado dá 2,4:1 sobre fundo
 * claro, abaixo dos 3:1 que a WCAG 1.4.11 exige de indicador de foco. `outline`
 * em vez de `ring` porque acompanha o formato do elemento e não é cortado por
 * `overflow` do container.
 */
export const FOCO =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marinho'

/** ~44px de altura: alvo de toque confortável no celular, sem precisar mirar. */
const ALVO_DE_TOQUE = 'min-h-11'

export const BOTAO_PRIMARIO = `${ALVO_DE_TOQUE} ${FOCO} rounded-md bg-marinho px-4 py-2 font-medium text-marfim disabled:opacity-60`

/** Ação de destaque: dourado só como fundo, com marinho por cima (5,88:1). */
export const BOTAO_DESTAQUE = `${ALVO_DE_TOQUE} ${FOCO} rounded-md bg-dourado px-4 py-2 font-medium text-marinho disabled:opacity-60`

export const BOTAO_SECUNDARIO = `${ALVO_DE_TOQUE} ${FOCO} rounded-md border border-pedra px-3 py-2 text-sm text-marinho disabled:opacity-60`

/** Botão de texto, sem moldura — para ações discretas dentro de tabela ou form. */
export const BOTAO_DISCRETO = `${FOCO} rounded-sm text-marinho underline underline-offset-2 disabled:opacity-60`

/**
 * Borda em `pedra` cheio, não `pedra/40`: a 40% dava 1,65:1 contra o fundo, e a
 * WCAG 1.4.11 pede 3:1 para a borda que identifica um campo.
 */
export const CAMPO = `${FOCO} min-h-11 rounded-md border border-pedra bg-white px-3 py-2 text-ardosia`

export const LINK = `${FOCO} rounded-sm text-marinho underline underline-offset-2`

export const ROTULO = 'text-sm font-medium text-marinho'

export const MENSAGEM_DE_ERRO = 'text-sm text-red-700'

/** Container das páginas: respiro menor no celular, maior a partir de `sm`. */
export const PAGINA =
  'mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-4 sm:p-6'

export const CARTAO = 'rounded-lg bg-white p-4 shadow-sm'
