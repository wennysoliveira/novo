import { prisma } from '~/server/utils/database'
import { readFile, fileExists } from '~/server/utils/fileHandler'
import { getSession, isSessionExpired, touchSession, SESSION_COOKIE_NAME } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  try {
    // Verificar autenticação
    const sessionId = getCookie(event, SESSION_COOKIE_NAME)
    const session = await getSession(sessionId)
    
    if (!session || isSessionExpired(session)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Não autorizado'
      })
    }
    
    await touchSession(sessionId!)

    const documentId = getRouterParam(event, 'id')
    
    if (!documentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do documento é obrigatório'
      })
    }

    // Buscar documento no banco
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        candidate: {
          select: { nomeCompleto: true, cpf: true }
        }
      }
    })

    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Documento não encontrado'
      })
    }

    // Verificar se arquivo existe no sistema de arquivos
    const fileExistsOnDisk = await fileExists(document.filepath)
    
    if (!fileExistsOnDisk) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Arquivo não encontrado no servidor'
      })
    }

    // Ler arquivo
    const fileBuffer = await readFile(document.filepath)

    // Definir headers para renderização inline no navegador
    setHeader(event, 'Content-Type', document.mimeType)
    setHeader(event, 'Content-Disposition', `inline; filename="${document.filename}"`)
    setHeader(event, 'Content-Length', document.size.toString())

    return fileBuffer

  } catch (error: any) {
    console.error('Erro ao baixar documento:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
