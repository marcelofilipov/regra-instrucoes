import type { IMembroRepository } from '@/domain/repositories/IMembroRepository'
import type { Membro } from '@/domain/entities/Membro'
import { DomainError } from '@/domain/errors/DomainError'

export interface DependenciasDeBuscaDeMembro {
  membros: IMembroRepository
}

/** Carrega um membro pela identidade; ausência é erro, não resultado vazio. */
export class ObterMembroUseCase {
  private readonly membros: IMembroRepository

  constructor(deps: DependenciasDeBuscaDeMembro) {
    this.membros = deps.membros
  }

  async executar(membroId: string): Promise<Membro> {
    const membro = await this.membros.buscarPorId(membroId)
    if (membro === null) {
      throw new DomainError(`Membro não encontrado: ${membroId}.`)
    }
    return membro
  }
}
