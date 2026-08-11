import type { IMembroRepository } from '@/domain/repositories/IMembroRepository'
import type { Membro } from '@/domain/entities/Membro'

export interface DependenciasDeListagemDeMembros {
  membros: IMembroRepository
}

/**
 * Lista os membros em ordem alfabética. Leitura é liberada a qualquer usuário
 * autenticado, então não há checagem de papel. Existe como caso de uso — e não
 * como chamada direta ao repositório na tela — para a apresentação continuar
 * falando só com a camada de aplicação.
 */
export class ListarMembrosUseCase {
  private readonly membros: IMembroRepository

  constructor(deps: DependenciasDeListagemDeMembros) {
    this.membros = deps.membros
  }

  async executar(): Promise<Membro[]> {
    const todos = await this.membros.listar()
    return [...todos].sort((um, outro) =>
      um.nome.localeCompare(outro.nome, 'pt-BR'),
    )
  }
}
