import { db } from '@/infrastructure/firebase/firebaseConfig'
import {
  criarServicosDeAutenticacao,
  type ServicosDeAutenticacao,
} from './servicosDeAutenticacao'
import { criarServicosDeGestao, type ServicosDeGestao } from './servicosDeGestao'

/**
 * Tudo que a árvore React recebe pronto. Manter a raiz de composição num só
 * lugar é o que permite os testes montarem as telas com fakes — nenhum
 * componente importa Firebase.
 */
export interface Servicos {
  autenticacao: ServicosDeAutenticacao
  gestao: ServicosDeGestao
}

export function criarServicos(): Servicos {
  return {
    autenticacao: criarServicosDeAutenticacao(),
    gestao: criarServicosDeGestao(db),
  }
}
