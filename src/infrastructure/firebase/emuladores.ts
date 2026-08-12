/**
 * Onde o NAVEGADOR encontra os emuladores — que nem sempre é onde eles escutam.
 * Num acesso remoto por túnel SSH, por exemplo, a porta local pode ser outra que
 * não a de `firebase.json`. Daí ser configurável por env, e não fixo no código.
 */

const HOST_PADRAO = '127.0.0.1'
const PORTA_PADRAO_DO_FIRESTORE = 8080
const PORTA_PADRAO_DO_AUTH = 9099
const PORTA_MAXIMA = 65535

/** Só o recorte que interessa do `import.meta.env` — mantém o teste livre do Vite. */
export type VariaveisDeAmbiente = Partial<Record<string, string>>

export interface EnderecosDosEmuladores {
  host: string
  portaDoFirestore: number
  portaDoAuth: number
}

export function lerEnderecosDosEmuladores(
  env: VariaveisDeAmbiente,
): EnderecosDosEmuladores {
  return {
    host: env.VITE_FIREBASE_EMULATOR_HOST || HOST_PADRAO,
    portaDoFirestore: lerPorta(env, 'VITE_FIRESTORE_EMULATOR_PORT', PORTA_PADRAO_DO_FIRESTORE),
    portaDoAuth: lerPorta(env, 'VITE_AUTH_EMULATOR_PORT', PORTA_PADRAO_DO_AUTH),
  }
}

/**
 * Recusa valor inválido em vez de cair no padrão: silenciar um erro de digitação
 * viraria "não conecta e não diz por quê" — o pior jeito de perder tempo aqui.
 */
function lerPorta(env: VariaveisDeAmbiente, nomeDaVariavel: string, padrao: number): number {
  const valor = env[nomeDaVariavel]
  if (!valor) {
    return padrao
  }

  const porta = Number(valor)
  const foraDoIntervalo = porta < 1 || porta > PORTA_MAXIMA
  if (!Number.isInteger(porta) || foraDoIntervalo) {
    throw new Error(
      `${nomeDaVariavel} inválida: "${valor}". Esperado inteiro entre 1 e ${PORTA_MAXIMA}.`,
    )
  }
  return porta
}
