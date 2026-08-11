/**
 * Porta de geração de identificadores. Existe para os casos de uso criarem
 * entidades com id próprio sem depender de `crypto` nem do Firestore — e para
 * os testes conseguirem ids previsíveis.
 */
export interface IGeradorDeId {
  gerar(): string
}
