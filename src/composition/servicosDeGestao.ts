import type { Firestore } from 'firebase/firestore'
import { CadastrarMembroUseCase } from '@/application/useCases/CadastrarMembroUseCase'
import { ListarMembrosUseCase } from '@/application/useCases/ListarMembrosUseCase'
import { ObterMembroUseCase } from '@/application/useCases/ObterMembroUseCase'
import { RegistrarInstrucaoUseCase } from '@/application/useCases/RegistrarInstrucaoUseCase'
import { AlterarDataInstrucaoUseCase } from '@/application/useCases/AlterarDataInstrucaoUseCase'
import { ListarInstrucoesPorMembroUseCase } from '@/application/useCases/ListarInstrucoesPorMembroUseCase'
import { ListarHistoricoDoMembroUseCase } from '@/application/useCases/ListarHistoricoDoMembroUseCase'
import { ExportarDadosUseCase } from '@/application/useCases/ExportarDadosUseCase'
import { ListarProgressoDosMembrosUseCase } from '@/application/useCases/ListarProgressoDosMembrosUseCase'
import { FirestoreMembroRepository } from '@/infrastructure/firebase/FirestoreMembroRepository'
import { FirestoreInstrucaoRepository } from '@/infrastructure/firebase/FirestoreInstrucaoRepository'
import { FirestoreAuditoriaRepository } from '@/infrastructure/firebase/FirestoreAuditoriaRepository'
import { FirestoreUsuarioRepository } from '@/infrastructure/firebase/FirestoreUsuarioRepository'
import { UuidGeradorDeId } from '@/infrastructure/UuidGeradorDeId'

/** Casos de uso de membros e instruções, como a apresentação os enxerga. */
export interface ServicosDeGestao {
  cadastrarMembro: CadastrarMembroUseCase
  listarMembros: ListarMembrosUseCase
  listarProgressoDosMembros: ListarProgressoDosMembrosUseCase
  obterMembro: ObterMembroUseCase
  registrarInstrucao: RegistrarInstrucaoUseCase
  alterarDataInstrucao: AlterarDataInstrucaoUseCase
  listarInstrucoesPorMembro: ListarInstrucoesPorMembroUseCase
  listarHistoricoDoMembro: ListarHistoricoDoMembroUseCase
  exportarDados: ExportarDadosUseCase
}

export function criarServicosDeGestao(db: Firestore): ServicosDeGestao {
  const membros = new FirestoreMembroRepository(db)
  const instrucoes = new FirestoreInstrucaoRepository(db)
  const auditoria = new FirestoreAuditoriaRepository(db)
  const usuarios = new FirestoreUsuarioRepository(db)
  const geradorDeId = new UuidGeradorDeId()
  const listarMembros = new ListarMembrosUseCase({ membros })

  return {
    cadastrarMembro: new CadastrarMembroUseCase({ membros, geradorDeId }),
    listarMembros,
    listarProgressoDosMembros: new ListarProgressoDosMembrosUseCase({
      listarMembros,
      instrucoes,
    }),
    obterMembro: new ObterMembroUseCase({ membros }),
    registrarInstrucao: new RegistrarInstrucaoUseCase({
      instrucoes,
      membros,
      geradorDeId,
    }),
    alterarDataInstrucao: new AlterarDataInstrucaoUseCase({
      instrucoes,
      geradorDeId,
    }),
    listarInstrucoesPorMembro: new ListarInstrucoesPorMembroUseCase({
      instrucoes,
    }),
    listarHistoricoDoMembro: new ListarHistoricoDoMembroUseCase({
      instrucoes,
      auditoria,
      usuarios,
    }),
    exportarDados: new ExportarDadosUseCase({
      membros,
      instrucoes,
      auditoria,
      usuarios,
    }),
  }
}
