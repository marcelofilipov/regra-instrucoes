import type { IMembroRepository } from '@/domain/repositories/IMembroRepository'
import type { IGeradorDeId } from '@/domain/services/IGeradorDeId'
import type { Usuario } from '@/domain/entities/Usuario'
import type { Grau } from '@/domain/enums/Grau'
import { Membro } from '@/domain/entities/Membro'
import { podeRegistrar } from '@/domain/enums/Papel'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

export interface DadosDeNovoMembro {
  nome: string
  grauAtual: Grau
  dataIniciacao: Date | null
}

export interface DependenciasDeCadastroDeMembro {
  membros: IMembroRepository
  geradorDeId: IGeradorDeId
  agora?: () => Date
}

/** Cadastra um membro. Editor e Admin podem; Leitor, não (Seção 2 do plano). */
export class CadastrarMembroUseCase {
  private readonly membros: IMembroRepository
  private readonly geradorDeId: IGeradorDeId
  private readonly agora: () => Date

  constructor(deps: DependenciasDeCadastroDeMembro) {
    this.membros = deps.membros
    this.geradorDeId = deps.geradorDeId
    this.agora = deps.agora ?? (() => new Date())
  }

  async executar(autor: Usuario, dados: DadosDeNovoMembro): Promise<Membro> {
    if (!podeRegistrar(autor.papel)) {
      throw new PermissaoNegadaError('cadastrar membros', autor.papel)
    }

    const membro = Membro.cadastrar({
      id: this.geradorDeId.gerar(),
      nome: dados.nome,
      grauAtual: dados.grauAtual,
      dataIniciacao: dados.dataIniciacao,
      quando: this.agora(),
    })
    await this.membros.salvar(membro)
    return membro
  }
}
