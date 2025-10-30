import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  
  if (!url || !url.startsWith('/_nuxt/')) {
    return
  }

  try {
    // Extrair o caminho do arquivo após /_nuxt/
    const filePath = url.replace(/^\/_nuxt\//, '')
    
    // Tentar diferentes caminhos possíveis para os arquivos
    const possiblePaths = [
      join('/app', '.output', 'public', '_nuxt', filePath),
      join('/app', '.output', 'server', 'chunks', 'public', '_nuxt', filePath),
      join(process.cwd(), '.output', 'public', '_nuxt', filePath),
      join(process.cwd(), '.output', 'server', 'chunks', 'public', '_nuxt', filePath),
      // Fallback: tentar sem o prefixo _nuxt
      join('/app', '.output', 'public', url),
      join(process.cwd(), '.output', 'public', url)
    ]

    let foundPath: string | null = null
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        foundPath = path
        break
      }
    }

    if (!foundPath) {
      console.warn('Arquivo estático não encontrado:', url, 'Testado em:', possiblePaths[0])
      setResponseStatus(event, 404)
      return { error: 'File not found', url }
    }

    // Ler e servir o arquivo
    const fileBuffer = await readFile(foundPath)
    
    // Determinar content type baseado na extensão
    const ext = foundPath.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      'js': 'application/javascript; charset=utf-8',
      'json': 'application/json; charset=utf-8',
      'css': 'text/css; charset=utf-8',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'svg': 'image/svg+xml',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf'
    }
    
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'
    
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    
    return fileBuffer
  } catch (error: any) {
    console.error('Erro ao servir arquivo estático:', error, 'URL:', url)
    setResponseStatus(event, 500)
    return { error: 'Internal server error', message: error.message }
  }
})

