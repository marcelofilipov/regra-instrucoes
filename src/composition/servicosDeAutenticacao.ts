import type { IProvedorAutenticacao } from '@/domain/auth/IProvedorAutenticacao'
import { AutenticarUsuarioUseCase } from '@/application/useCases/AutenticarUsuarioUseCase'
import { CriarContaUseCase } from '@/application/useCases/CriarContaUseCase'
import { GarantirPerfilUseCase } from '@/application/useCases/GarantirPerfilUseCase'
import { FirebaseAuthProvider } from '@/infrastructure/firebase/FirebaseAuthProvider'
import { FirestoreUsuarioRepository } from '@/infrastructure/firebase/FirestoreUsuarioRepository'
import { auth, db } from '@/infrastructure/firebase/firebaseConfig'

/** O que a camada de apresentação precisa para autenticar — só abstrações. */
export interface ServicosDeAutenticacao {
  provedor: IProvedorAutenticacao
  autenticarUsuario: AutenticarUsuarioUseCase
  criarConta: CriarContaUseCase
  garantirPerfil: GarantirPerfilUseCase
}

/**
 * Raiz de composição: o único ponto do app que conhece implementações
 * concretas. Separar construção de uso é o que permite trocar Firebase por
 * fakes nos testes sem mexer em componente nenhum.
 */
export function criarServicosDeAutenticacao(): ServicosDeAutenticacao {
  const provedor = new FirebaseAuthProvider(auth)
  const garantirPerfil = new GarantirPerfilUseCase(
    new FirestoreUsuarioRepository(db),
  )

  return {
    provedor,
    garantirPerfil,
    autenticarUsuario: new AutenticarUsuarioUseCase(provedor, garantirPerfil),
    criarConta: new CriarContaUseCase(provedor, garantirPerfil),
  }
}
