/**
 * Papéis de acesso (Seção 2 do plano). A matriz de permissão vive aqui, no
 * domínio, para ser reutilizada tanto pelos casos de uso (feedback rápido na
 * UI) quanto — espelhada — pelas Security Rules do Firestore (garantia real).
 */
export const Papel = {
  LEITOR: 'leitor',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const

export type Papel = (typeof Papel)[keyof typeof Papel]

export function isPapel(valor: unknown): valor is Papel {
  return (
    typeof valor === 'string' &&
    (Object.values(Papel) as string[]).includes(valor)
  )
}

/** Cadastrar membro e registrar instrução pela 1ª vez: Editor ou Admin. */
export function podeRegistrar(papel: Papel): boolean {
  return papel === Papel.EDITOR || papel === Papel.ADMIN
}

/** Alterar data já gravada, excluir e gerenciar papéis: só Admin. */
export function podeAlterar(papel: Papel): boolean {
  return papel === Papel.ADMIN
}

export function podeExcluir(papel: Papel): boolean {
  return papel === Papel.ADMIN
}

export function podeGerenciarPapeis(papel: Papel): boolean {
  return papel === Papel.ADMIN
}
