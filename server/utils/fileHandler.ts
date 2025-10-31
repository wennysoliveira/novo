import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// Garantir que o diretório de upload existe
export async function ensureUploadDir(cpf: string) {
  // Normalizar UPLOAD_DIR para caminho absoluto
  const uploadBase = path.isAbsolute(UPLOAD_DIR) 
    ? UPLOAD_DIR 
    : path.resolve(process.cwd(), UPLOAD_DIR)
  
  const candidateDir = path.join(uploadBase, cpf.replace(/\D/g, ''))
  await fs.mkdir(candidateDir, { recursive: true })
  return candidateDir
}

// Salvar arquivo
export async function saveFile(
  file: { buffer: Buffer; mimeType: string; filename: string },
  cpf: string,
  type: string
): Promise<{ filepath: string; filename: string }> {
  const candidateDir = await ensureUploadDir(cpf)
  
  // Gerar nome único para o arquivo
  const extension = path.extname(file.filename)
  const uniqueFilename = `${type}_${randomUUID()}${extension}`
  const filepath = path.join(candidateDir, uniqueFilename)
  
  // Salvar arquivo
  await fs.writeFile(filepath, file.buffer)
  
  // Salvar caminho absoluto no banco para garantir consistência
  const absolutePath = path.isAbsolute(filepath) 
    ? filepath 
    : path.resolve(process.cwd(), filepath)
  
  console.log(`Arquivo salvo: ${absolutePath} (UPLOAD_DIR: ${UPLOAD_DIR})`)
  
  return {
    filepath: absolutePath.replace(/\\/g, '/'), // Normalizar separadores, sempre absoluto
    filename: uniqueFilename
  }
}

// Resolver caminho do arquivo (suporta tanto absoluto quanto relativo)
function resolveFilePath(filepath: string): string {
  // Se já é absoluto, retornar como está
  if (path.isAbsolute(filepath)) {
    return filepath
  }
  
  // Se é relativo, tentar resolver usando UPLOAD_DIR base
  const uploadBase = path.isAbsolute(UPLOAD_DIR) 
    ? UPLOAD_DIR 
    : path.resolve(process.cwd(), UPLOAD_DIR)
  
  // Se o filepath começa com ./uploads ou uploads/, remover e resolver
  const normalizedPath = filepath.replace(/^\.\//, '').replace(/^uploads\//, '')
  return path.resolve(uploadBase, normalizedPath)
}

// Ler arquivo
export async function readFile(filepath: string): Promise<Buffer> {
  const resolvedPath = resolveFilePath(filepath)
  console.log(`Tentando ler arquivo: ${resolvedPath} (original: ${filepath})`)
  return await fs.readFile(resolvedPath)
}

// Verificar se arquivo existe
export async function fileExists(filepath: string): Promise<boolean> {
  try {
    const resolvedPath = resolveFilePath(filepath)
    console.log(`Verificando se arquivo existe: ${resolvedPath} (original: ${filepath})`)
    await fs.access(resolvedPath)
    return true
  } catch (error: any) {
    console.error(`Arquivo não encontrado: ${filepath} (resolvido: ${resolveFilePath(filepath)})`, error.message)
    return false
  }
}

// Validar tipo MIME
export function validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType)
}

// Tipos MIME permitidos
export const ALLOWED_MIME_TYPES = {
  PDF: ['application/pdf'],
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png'],
  ALL: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
} as const
