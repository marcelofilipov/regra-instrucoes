import type { SnapshotDaLoja } from '@/application/useCases/ExportarDadosUseCase'

export interface ArquivoExportado {
  nome: string
  conteudo: string
}

/** Sobe junto no JSON: quem restaurar precisa saber de quando é a cópia. */
const VERSAO_DO_FORMATO = 1

/**
 * JSON é o formato de restauração: preserva estrutura, tipos e os quatro
 * conjuntos num arquivo só. Datas viram ISO 8601, como no resto do sistema.
 */
export function paraJson(snapshot: SnapshotDaLoja): ArquivoExportado {
  const conteudo = {
    versao: VERSAO_DO_FORMATO,
    geradoEm: snapshot.geradoEm.toISOString(),
    geradoPor: snapshot.geradoPor,
    membros: snapshot.membros.map((membro) => ({
      id: membro.id,
      nome: membro.nome,
      grauAtual: membro.grauAtual,
      dataIniciacao: talvezIso(membro.dataIniciacao),
      ativo: membro.ativo,
      criadoEm: membro.criadoEm.toISOString(),
      atualizadoEm: membro.atualizadoEm.toISOString(),
    })),
    instrucoes: snapshot.instrucoes.map((instrucao) => ({
      id: instrucao.id,
      membroId: instrucao.membroId,
      grau: instrucao.grau,
      numero: instrucao.numero,
      dataRecebimento: instrucao.dataRecebimento.toISOString(),
      registradoPor: instrucao.registradoPor,
      registradoEm: instrucao.registradoEm.toISOString(),
      alteradoPor: instrucao.alteradoPor,
      alteradoEm: talvezIso(instrucao.alteradoEm),
    })),
    usuarios: snapshot.usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      criadoEm: usuario.criadoEm.toISOString(),
    })),
    auditoria: snapshot.auditoria.map((registro) => ({
      id: registro.id,
      instrucaoId: registro.instrucaoId,
      campoAlterado: registro.campoAlterado,
      valorAnterior: registro.valorAnterior,
      valorNovo: registro.valorNovo,
      alteradoPor: registro.alteradoPor,
      alteradoEm: registro.alteradoEm.toISOString(),
    })),
  }

  return {
    nome: `loja-${carimbo(snapshot.geradoEm)}.json`,
    conteudo: JSON.stringify(conteudo, null, 2),
  }
}

/**
 * CSV é o formato de leitura: uma planilha por coleção, porque um CSV só não
 * comporta quatro tabelas de colunas diferentes sem virar remendo.
 */
export function paraArquivosCsv(snapshot: SnapshotDaLoja): ArquivoExportado[] {
  const data = carimbo(snapshot.geradoEm)

  return [
    montarCsv(`loja-membros-${data}.csv`, snapshot.membros, [
      ['id', (m) => m.id],
      ['nome', (m) => m.nome],
      ['grauAtual', (m) => m.grauAtual],
      ['dataIniciacao', (m) => talvezIso(m.dataIniciacao) ?? ''],
      ['ativo', (m) => String(m.ativo)],
      ['criadoEm', (m) => m.criadoEm.toISOString()],
      ['atualizadoEm', (m) => m.atualizadoEm.toISOString()],
    ]),
    montarCsv(`loja-instrucoes-${data}.csv`, snapshot.instrucoes, [
      ['id', (i) => i.id],
      ['membroId', (i) => i.membroId],
      ['grau', (i) => i.grau],
      ['numero', (i) => String(i.numero)],
      ['dataRecebimento', (i) => i.dataRecebimento.toISOString()],
      ['registradoPor', (i) => i.registradoPor],
      ['registradoEm', (i) => i.registradoEm.toISOString()],
      ['alteradoPor', (i) => i.alteradoPor ?? ''],
      ['alteradoEm', (i) => talvezIso(i.alteradoEm) ?? ''],
    ]),
    montarCsv(`loja-usuarios-${data}.csv`, snapshot.usuarios, [
      ['id', (u) => u.id],
      ['nome', (u) => u.nome],
      ['email', (u) => u.email],
      ['papel', (u) => u.papel],
      ['criadoEm', (u) => u.criadoEm.toISOString()],
    ]),
    montarCsv(`loja-auditoria-${data}.csv`, snapshot.auditoria, [
      ['id', (r) => r.id],
      ['instrucaoId', (r) => r.instrucaoId],
      ['campoAlterado', (r) => r.campoAlterado],
      ['valorAnterior', (r) => r.valorAnterior],
      ['valorNovo', (r) => r.valorNovo],
      ['alteradoPor', (r) => r.alteradoPor],
      ['alteradoEm', (r) => r.alteradoEm.toISOString()],
    ]),
  ]
}

type Coluna<T> = [titulo: string, valor: (item: T) => string]

/**
 * BOM na frente porque o destino provável é o Excel: sem ele, o Windows lê o
 * arquivo como Latin-1 e todo "instrução" chega corrompido. CRLF por RFC 4180.
 */
const BOM = '﻿'
const QUEBRA = '\r\n'

function montarCsv<T>(
  nome: string,
  itens: readonly T[],
  colunas: readonly Coluna<T>[],
): ArquivoExportado {
  const titulos = colunas.map(([titulo]) => titulo)
  const linhas = itens.map((item) =>
    colunas.map(([, valor]) => valor(item)),
  )

  const conteudo =
    BOM +
    [titulos, ...linhas].map((linha) => linha.map(escapar).join(',')).join(QUEBRA) +
    QUEBRA

  return { nome, conteudo }
}

/** Aspas, vírgula e quebra de linha exigem o campo entre aspas, com "" dobradas. */
function escapar(valor: string): string {
  if (!/["\n\r,]/.test(valor)) {
    return valor
  }
  return `"${valor.replace(/"/g, '""')}"`
}

function talvezIso(data: Date | null): string | null {
  return data === null ? null : data.toISOString()
}

/** `YYYY-MM-DD` local, para o arquivo sair com a data que o usuário enxerga. */
function carimbo(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}
