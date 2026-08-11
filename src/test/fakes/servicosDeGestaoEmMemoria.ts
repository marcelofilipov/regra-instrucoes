import type { ServicosDeGestao } from '@/composition/servicosDeGestao'
import { CadastrarMembroUseCase } from '@/application/useCases/CadastrarMembroUseCase'
import { ListarMembrosUseCase } from '@/application/useCases/ListarMembrosUseCase'
import { ListarProgressoDosMembrosUseCase } from '@/application/useCases/ListarProgressoDosMembrosUseCase'
import { ObterMembroUseCase } from '@/application/useCases/ObterMembroUseCase'
import { RegistrarInstrucaoUseCase } from '@/application/useCases/RegistrarInstrucaoUseCase'
import { AlterarDataInstrucaoUseCase } from '@/application/useCases/AlterarDataInstrucaoUseCase'
import { ListarInstrucoesPorMembroUseCase } from '@/application/useCases/ListarInstrucoesPorMembroUseCase'
import { MembroRepositoryEmMemoria } from './MembroRepositoryEmMemoria'
import { InstrucaoRepositoryEmMemoria } from './InstrucaoRepositoryEmMemoria'
import { GeradorDeIdFake } from './GeradorDeIdFake'

export interface GestaoEmMemoria {
  servicos: ServicosDeGestao
  membros: MembroRepositoryEmMemoria
  instrucoes: InstrucaoRepositoryEmMemoria
}

/**
 * Os casos de uso reais sobre repositórios em memória — as telas são testadas
 * contra a mesma composição que roda em produção, trocando só o banco.
 */
export function criarGestaoEmMemoria(): GestaoEmMemoria {
  const membros = new MembroRepositoryEmMemoria()
  const instrucoes = new InstrucaoRepositoryEmMemoria()
  const geradorDeId = new GeradorDeIdFake()
  const listarMembros = new ListarMembrosUseCase({ membros })

  return {
    membros,
    instrucoes,
    servicos: {
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
    },
  }
}
