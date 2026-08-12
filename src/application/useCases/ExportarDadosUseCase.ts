import type { IMembroRepository } from '@/domain/repositories/IMembroRepository'
import type { IInstrucaoRepository } from '@/domain/repositories/IInstrucaoRepository'
import type { IAuditoriaRepository } from '@/domain/repositories/IAuditoriaRepository'
import type { IUsuarioRepository } from '@/domain/repositories/IUsuarioRepository'
import type { Membro } from '@/domain/entities/Membro'
import type { Instrucao } from '@/domain/entities/Instrucao'
import type { Usuario } from '@/domain/entities/Usuario'
import type { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'
import { podeAlterar } from '@/domain/enums/Papel'
import { PermissaoNegadaError } from '@/domain/errors/PermissaoNegadaError'

/** Cópia completa da Loja num instante — o que vai para o arquivo baixado. */
export interface SnapshotDaLoja {
  geradoEm: Date
  geradoPor: string
  membros: Membro[]
  instrucoes: Instrucao[]
  usuarios: Usuario[]
  auditoria: RegistroDeAuditoria[]
}

export interface DependenciasDeExportacao {
  membros: IMembroRepository
  instrucoes: IInstrucaoRepository
  auditoria: IAuditoriaRepository
  usuarios: IUsuarioRepository
  agora?: () => Date
}

/**
 * Junta as quatro coleções numa cópia só, para o Admin guardar antes de mexer
 * em algo sensível — o Spark não tem exportação agendada, então esta é a única
 * rede de segurança contra uma exclusão acidental (Seção 9 do plano).
 *
 * `usuarios` entra junto de propósito: um backup sem os papéis restaura os
 * dados mas não restaura quem pode o quê.
 *
 * Atenção ao alcance da trava: as rules liberam leitura destas coleções a
 * qualquer autenticado, então recusar não-Admin aqui organiza a UI, mas não é
 * barreira de segurança. Quem quisesse os mesmos dados poderia lê-los pelo SDK.
 */
export class ExportarDadosUseCase {
  private readonly membros: IMembroRepository
  private readonly instrucoes: IInstrucaoRepository
  private readonly auditoria: IAuditoriaRepository
  private readonly usuarios: IUsuarioRepository
  private readonly agora: () => Date

  constructor(deps: DependenciasDeExportacao) {
    this.membros = deps.membros
    this.instrucoes = deps.instrucoes
    this.auditoria = deps.auditoria
    this.usuarios = deps.usuarios
    this.agora = deps.agora ?? (() => new Date())
  }

  async executar(autor: Usuario): Promise<SnapshotDaLoja> {
    if (!podeAlterar(autor.papel)) {
      throw new PermissaoNegadaError('exportar os dados da Loja', autor.papel)
    }

    // Em paralelo: são quatro consultas independentes e a tela espera por todas.
    const [membros, instrucoes, usuarios, auditoria] = await Promise.all([
      this.membros.listar(),
      this.instrucoes.listarTodas(),
      this.usuarios.listar(),
      this.auditoria.listarTodos(),
    ])

    return {
      geradoEm: this.agora(),
      geradoPor: autor.email,
      membros,
      instrucoes,
      usuarios,
      auditoria,
    }
  }
}
