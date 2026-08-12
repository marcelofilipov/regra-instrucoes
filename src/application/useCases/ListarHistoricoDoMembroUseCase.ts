import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { IAuditoriaRepository } from '@/domain/repositories/IAuditoriaRepository'
import type { IUsuarioRepository } from '@/domain/repositories/IUsuarioRepository'
import type { Instrucao } from '@/domain/entities/Instrucao'
import type { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'

/** Uma linha do histórico já pronta para a tela: o log, o que ele alterou e quem. */
export interface AlteracaoDoHistorico {
  registro: RegistroDeAuditoria
  instrucao: Instrucao
  autor: string
}

export interface DependenciasDeHistorico {
  instrucoes: IInstrucaoRepository
  auditoria: IAuditoriaRepository
  usuarios: IUsuarioRepository
}

/**
 * Trilha de auditoria de um membro, do mais recente para o mais antigo.
 *
 * Resolve o uid do autor para nome aqui, e não na tela: quem lê a ficha quer
 * saber quem corrigiu, e um uid não responde isso. Cada autor é buscado uma vez
 * só — numa Loja são dois ou três Admins, então a conta fecha bem no Spark.
 */
export class ListarHistoricoDoMembroUseCase {
  private readonly instrucoes: IInstrucaoRepository
  private readonly auditoria: IAuditoriaRepository
  private readonly usuarios: IUsuarioRepository

  constructor(deps: DependenciasDeHistorico) {
    this.instrucoes = deps.instrucoes
    this.auditoria = deps.auditoria
    this.usuarios = deps.usuarios
  }

  async executar(membroId: string): Promise<AlteracaoDoHistorico[]> {
    const instrucoes = await this.instrucoes.listarPorMembro(membroId)
    const porId = new Map(instrucoes.map((instrucao) => [instrucao.id, instrucao]))

    const registros = await this.auditoria.listarPorInstrucoes([...porId.keys()])
    const autores = await this.nomesDosAutores(registros)

    return registros.flatMap((registro) => {
      const instrucao = porId.get(registro.instrucaoId)
      if (instrucao === undefined) return []
      return [{
        registro,
        instrucao,
        autor: autores.get(registro.alteradoPor) ?? registro.alteradoPor,
      }]
    })
  }

  /** Perfil apagado não some do histórico: quem chama cai de volta no uid. */
  private async nomesDosAutores(
    registros: readonly RegistroDeAuditoria[],
  ): Promise<Map<string, string>> {
    const uids = [...new Set(registros.map((registro) => registro.alteradoPor))]
    const perfis = await Promise.all(uids.map((uid) => this.usuarios.buscarPorId(uid)))

    return new Map(
      perfis
        .filter((perfil) => perfil !== null)
        .map((perfil) => [perfil.id, perfil.nome]),
    )
  }
}
