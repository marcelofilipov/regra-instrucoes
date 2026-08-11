import { Grau } from '@/domain/enums/Grau'
import { Papel } from '@/domain/enums/Papel'

/** Valores do domínio são minúsculos e estáveis; a tela mostra o rótulo. */
export const ROTULO_DO_GRAU: Record<Grau, string> = {
  [Grau.APRENDIZ]: 'Aprendiz',
  [Grau.COMPANHEIRO]: 'Companheiro',
  [Grau.MESTRE]: 'Mestre',
}

export const ROTULO_DO_PAPEL: Record<Papel, string> = {
  [Papel.LEITOR]: 'Leitor',
  [Papel.EDITOR]: 'Editor',
  [Papel.ADMIN]: 'Admin',
}
