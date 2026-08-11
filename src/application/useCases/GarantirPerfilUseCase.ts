import type { IUsuarioRepository } from '@/domain/repositories/IUsuarioRepository'
import type { Credencial } from '@/domain/auth/IProvedorAutenticacao'
import { Usuario } from '@/domain/entities/Usuario'

/**
 * Traduz uma credencial autenticada no perfil de domínio correspondente,
 * criando-o como `leitor` no primeiro acesso.
 *
 * Existe porque autenticar e ter perfil são coisas separadas aqui: o Firebase
 * Auth diz quem é a pessoa, o documento `usuarios/{uid}` diz o que ela pode
 * fazer. Login, criação de conta e restauração de sessão precisam do mesmo
 * passo — daí o caso de uso compartilhado em vez de três cópias da regra.
 */
export class GarantirPerfilUseCase {
  private readonly repositorio: IUsuarioRepository
  private readonly agora: () => Date

  constructor(repositorio: IUsuarioRepository, agora: () => Date = () => new Date()) {
    this.repositorio = repositorio
    this.agora = agora
  }

  async executar(credencial: Credencial): Promise<Usuario> {
    const perfilExistente = await this.repositorio.buscarPorId(credencial.uid)
    if (perfilExistente !== null) return perfilExistente

    const novoPerfil = Usuario.registrar({
      id: credencial.uid,
      nome: this.nomeDeExibicao(credencial),
      email: credencial.email,
      quando: this.agora(),
    })
    await this.repositorio.salvar(novoPerfil)
    return novoPerfil
  }

  /** Contas antigas podem não ter nome no provedor; o e-mail serve de rótulo. */
  private nomeDeExibicao(credencial: Credencial): string {
    const nomeInformado = credencial.nome?.trim() ?? ''
    if (nomeInformado.length > 0) return nomeInformado
    return credencial.email.split('@')[0]
  }
}
