import { describe, expect, it } from 'vitest'
import { paraArquivosCsv, paraJson } from './serializadores'
import type { SnapshotDaLoja } from '@/application/useCases/ExportarDadosUseCase'
import { Membro } from '@/domain/entities/Membro'
import { Instrucao } from '@/domain/entities/Instrucao'
import { RegistroDeAuditoria } from '@/domain/entities/RegistroDeAuditoria'
import { Grau } from '@/domain/enums/Grau'
import { admin } from '@/test/fixtures/usuarios'

const GERADO_EM = new Date(2026, 7, 11, 14, 30)
const DEZ_DE_MARCO = new Date(2026, 2, 10, 12)
const DEZESSETE_DE_MARCO = new Date(2026, 2, 17, 12)

function snapshotCom(ajustes: Partial<SnapshotDaLoja> = {}): SnapshotDaLoja {
  return {
    geradoEm: GERADO_EM,
    geradoPor: admin().email,
    membros: [
      Membro.cadastrar({
        id: 'm1',
        nome: 'Marcelo Rodrigo',
        grauAtual: Grau.APRENDIZ,
        dataIniciacao: DEZ_DE_MARCO,
        quando: DEZ_DE_MARCO,
      }),
    ],
    instrucoes: [
      Instrucao.registrar({
        id: 'i1',
        membroId: 'm1',
        grau: Grau.APRENDIZ,
        numero: 1,
        dataRecebimento: DEZ_DE_MARCO,
        registradoPor: 'uid-editor',
        registradoEm: DEZ_DE_MARCO,
      }),
    ],
    usuarios: [admin()],
    auditoria: [
      RegistroDeAuditoria.daAlteracaoDeData({
        id: 'log-1',
        instrucaoId: 'i1',
        dataAnterior: DEZ_DE_MARCO,
        dataNova: DEZESSETE_DE_MARCO,
        alteradoPor: admin().id,
        alteradoEm: GERADO_EM,
      }),
    ],
    ...ajustes,
  }
}

function csvChamado(nome: string, snapshot = snapshotCom()): string {
  const arquivo = paraArquivosCsv(snapshot).find((a) => a.nome.includes(nome))
  if (arquivo === undefined) throw new Error(`CSV de ${nome} não foi gerado`)
  return arquivo.conteudo
}

describe('paraJson', () => {
  it('nomeia o arquivo com a data local da geração', () => {
    expect(paraJson(snapshotCom()).nome).toBe('loja-2026-08-11.json')
  })

  it('traz as quatro coleções e o cabeçalho da cópia', () => {
    const conteudo = JSON.parse(paraJson(snapshotCom()).conteudo)

    expect(conteudo.versao).toBe(1)
    expect(conteudo.geradoPor).toBe(admin().email)
    expect(conteudo.membros).toHaveLength(1)
    expect(conteudo.instrucoes).toHaveLength(1)
    expect(conteudo.usuarios).toHaveLength(1)
    expect(conteudo.auditoria).toHaveLength(1)
  })

  it('inclui o papel do usuário — é o que permite restaurar quem pode o quê', () => {
    const conteudo = JSON.parse(paraJson(snapshotCom()).conteudo)
    expect(conteudo.usuarios[0].papel).toBe('admin')
  })

  it('datas viram ISO e voltam a ser a mesma data', () => {
    const conteudo = JSON.parse(paraJson(snapshotCom()).conteudo)
    expect(new Date(conteudo.instrucoes[0].dataRecebimento)).toEqual(DEZ_DE_MARCO)
  })

  it('campo opcional ausente vira null, não some do arquivo', () => {
    const conteudo = JSON.parse(paraJson(snapshotCom()).conteudo)
    expect(conteudo.instrucoes[0].alteradoEm).toBeNull()
    expect(conteudo.instrucoes[0].alteradoPor).toBeNull()
  })
})

describe('paraArquivosCsv', () => {
  it('gera uma planilha por coleção', () => {
    expect(paraArquivosCsv(snapshotCom()).map((a) => a.nome)).toEqual([
      'loja-membros-2026-08-11.csv',
      'loja-instrucoes-2026-08-11.csv',
      'loja-usuarios-2026-08-11.csv',
      'loja-auditoria-2026-08-11.csv',
    ])
  })

  it('abre com BOM, para o Excel não corromper acento', () => {
    expect(csvChamado('membros').startsWith('﻿')).toBe(true)
  })

  it('primeira linha é o cabeçalho das colunas', () => {
    const [cabecalho] = csvChamado('membros').replace('﻿', '').split('\r\n')
    expect(cabecalho).toBe(
      'id,nome,grauAtual,dataIniciacao,ativo,criadoEm,atualizadoEm',
    )
  })

  it('escapa vírgula pondo o campo entre aspas', () => {
    const comVirgula = snapshotCom({
      membros: [
        Membro.cadastrar({
          id: 'm1',
          nome: 'Rodrigo, Marcelo',
          grauAtual: Grau.APRENDIZ,
          dataIniciacao: null,
          quando: DEZ_DE_MARCO,
        }),
      ],
    })

    expect(csvChamado('membros', comVirgula)).toContain('"Rodrigo, Marcelo"')
  })

  it('escapa aspas dobrando-as', () => {
    const comAspas = snapshotCom({
      membros: [
        Membro.cadastrar({
          id: 'm1',
          nome: 'Marcelo "Filipov"',
          grauAtual: Grau.APRENDIZ,
          dataIniciacao: null,
          quando: DEZ_DE_MARCO,
        }),
      ],
    })

    expect(csvChamado('membros', comAspas)).toContain('"Marcelo ""Filipov"""')
  })

  it('data ausente vira célula vazia, sem escrever "null"', () => {
    const semIniciacao = snapshotCom({
      membros: [
        Membro.cadastrar({
          id: 'm1',
          nome: 'Sem data',
          grauAtual: Grau.APRENDIZ,
          dataIniciacao: null,
          quando: DEZ_DE_MARCO,
        }),
      ],
    })

    const linha = csvChamado('membros', semIniciacao).split('\r\n')[1]
    expect(linha).toContain('m1,Sem data,aprendiz,,true,')
    expect(linha).not.toContain('null')
  })

  it('coleção vazia gera arquivo só com cabeçalho', () => {
    const conteudo = csvChamado('auditoria', snapshotCom({ auditoria: [] }))
    const linhas = conteudo.replace('﻿', '').split('\r\n').filter(Boolean)
    expect(linhas).toHaveLength(1)
  })
})
