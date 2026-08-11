import type { IProvedorAutenticacao } from '@/domain/auth/IProvedorAutenticacao'
import type { Usuario } from '@/domain/entities/Usuario'
import { garantirTextoPresente } from '@/domain/guards'
import type { GarantirPerfilUseCase } from './GarantirPerfilUseCase'

export interface DadosDeNovaConta {
  nome: string
  email: string
  senha: string
}

/**
 * Cria a conta no provedor e o perfil correspondente. O papel `leitor` não é
 * parâmetro: quem o define é a entidade `Usuario`, e a Security Rule recusa
 * qualquer `create` com papel diferente.
 */
export class CriarContaUseCase {
  private readonly provedor: IProvedorAutenticacao
  private readonly garantirPerfil: GarantirPerfilUseCase

  constructor(
    provedor: IProvedorAutenticacao,
    garantirPerfil: GarantirPerfilUseCase,
  ) {
    this.provedor = provedor
    this.garantirPerfil = garantirPerfil
  }

  async executar(dados: DadosDeNovaConta): Promise<Usuario> {
    garantirTextoPresente(dados.nome, 'nome')

    const credencial = await this.provedor.criarConta(
      dados.email,
      dados.senha,
      dados.nome,
    )
    return this.garantirPerfil.executar({ ...credencial, nome: dados.nome })
  }
}
