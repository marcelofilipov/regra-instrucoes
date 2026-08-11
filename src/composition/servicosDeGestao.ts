import type { Firestore } from 'firebase/firestore'
import { CadastrarMembroUseCase } from '@/application/useCases/CadastrarMembroUseCase'
import { ListarMembrosUseCase } from '@/application/useCases/ListarMembrosUseCase'
import { ObterMembroUseCase } from '@/application/useCases/ObterMembroUseCase'
import { RegistrarInstrucaoUseCase } from '@/application/useCases/RegistrarInstrucaoUseCase'
import { AlterarDataInstrucaoUseCase } from '@/application/useCases/AlterarDataInstrucaoUseCase'
import { ListarInstrucoesPorMembroUseCase } from '@/application/useCases/ListarInstrucoesPorMembroUseCase'
import { ListarProgressoDosMembrosUseCase } from '@/application/useCases/ListarProgressoDosMembrosUseCase'
import { FirestoreMembroRepository } from '@/infrastructure/firebase/FirestoreMembroRepository'
import { FirestoreInstrucaoRepository } from '@/infrastructure/firebase/FirestoreInstrucaoRepository'
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
}

export function criarServicosDeGestao(db: Firestore): ServicosDeGestao {
  const membros = new FirestoreMembroRepository(db)
  const instrucoes = new FirestoreInstrucaoRepository(db)
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
    alterarDataInstrucao: new AlterarDataInstrucaoUseCase({ instrucoes }),
    listarInstrucoesPorMembro: new ListarInstrucoesPorMembroUseCase({
      instrucoes,
    }),
  }
}
