import type { ArquivoExportado } from '@/application/exportacao/serializadores'

const TIPOS_MIME: Record<string, string> = {
  json: 'application/json;charset=utf-8',
  csv: 'text/csv;charset=utf-8',
}

/**
 * Dispara o download no navegador. Isolado num módulo próprio porque é o único
 * ponto da exportação que toca o DOM — o resto (montar e serializar) é puro e
 * testável sem navegador.
 */
export function baixarArquivo(arquivo: ArquivoExportado): void {
  const extensao = arquivo.nome.split('.').pop() ?? ''
  const blob = new Blob([arquivo.conteudo], {
    type: TIPOS_MIME[extensao] ?? 'application/octet-stream',
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = arquivo.nome
  link.click()

  // Sem revogar, o blob fica retido em memória enquanto a aba viver.
  URL.revokeObjectURL(url)
}
