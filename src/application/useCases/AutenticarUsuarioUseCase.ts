import type { IProvedorAutenticacao } from '@/domain/auth/IProvedorAutenticacao'
import type { Usuario } from '@/domain/entities/Usuario'
import type { GarantirPerfilUseCase } from './GarantirPerfilUseCase'

export interface DadosDeLogin {
  email: string
  senha: string
}

/** Entra com e-mail e senha e devolve o perfil de domínio já com o papel. */
export class AutenticarUsuarioUseCase {
  private readonly provedor: IProvedorAutenticacao
  private readonly garantirPerfil: GarantirPerfilUseCase

  constructor(
    provedor: IProvedorAutenticacao,
    garantirPerfil: GarantirPerfilUseCase,
  ) {
    this.provedor = provedor
    this.garantirPerfil = garantirPerfil
  }

  async executar(dados: DadosDeLogin): Promise<Usuario> {
    const credencial = await this.provedor.entrar(dados.email, dados.senha)
    return this.garantirPerfil.executar(credencial)
  }
}
