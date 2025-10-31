import { prisma } from '~/server/utils/database'
import { getSession, isSessionExpired, touchSession, SESSION_COOKIE_NAME } from '~/server/utils/sessionStore'

/**
 * Exclusão em lote de inscrições (candidates) – APENAS ADMIN LOGADO
 * 
 * Exemplo de body (qualquer combinação dos filtros abaixo):
 * {
 *   ids: ["candidateId1", "candidateId2"],
 *   createdFrom: "2025-10-30T00:00:00Z",
 *   createdTo: "2025-10-31T23:59:59Z",
 *   cpfLike: "temp-",              // começa/contém (usa contains)
 *   emailLike: "@example.com"      // começa/contém (usa contains)
 * }
 */
export default defineEventHandler(async (event) => {
  // Verificar sessão admin
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  const session = await getSession(sessionId)
  if (!session || isSessionExpired(session)) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }
  await touchSession(sessionId!)

  // Ler body com filtros
  const body = await readBody(event).catch(() => ({})) as {
    ids?: string[]
    createdFrom?: string
    createdTo?: string
    cpfLike?: string
    emailLike?: string
  }

  // Construir where dinamicamente
  const where: any = {}

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    where.id = { in: body.ids }
  }

  // Intervalo de datas
  if (body.createdFrom || body.createdTo) {
    where.createdAt = {}
    if (body.createdFrom) where.createdAt.gte = new Date(body.createdFrom)
    if (body.createdTo) where.createdAt.lte = new Date(body.createdTo)
  }

  // Padrões (contains)
  if (body.cpfLike) {
    where.cpf = { contains: body.cpfLike }
  }
  if (body.emailLike) {
    where.email = { contains: body.emailLike, mode: 'insensitive' }
  }

  // Evitar exclusão sem filtro algum
  if (Object.keys(where).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'É necessário informar ao menos um filtro para exclusão.' })
  }

  // Contagem prévia (para feedback)
  const toDelete = await prisma.candidate.count({ where })

  // Exclusão em lote – relações têm onDelete: Cascade no schema
  const result = await prisma.candidate.deleteMany({ where })

  return {
    success: true,
    matched: toDelete,
    deleted: result.count
  }
})


