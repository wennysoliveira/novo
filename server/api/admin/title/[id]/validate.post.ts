import { prisma } from '~/server/utils/database'
import { getSession, isSessionExpired, touchSession, SESSION_COOKIE_NAME } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  try {
    // Verificar autenticação
    const sessionId = getCookie(event, SESSION_COOKIE_NAME)
    const session = await getSession(sessionId)
    
    if (!session || isSessionExpired(session)) {
      throw createError({
        statusCode: 401,
        message: 'Não autorizado'
      })
    }
    
    await touchSession(sessionId!)

    const titleId = getRouterParam(event, 'id')
    
    if (!titleId) {
      throw createError({
        statusCode: 400,
        message: 'ID do título é obrigatório'
      })
    }

    const body = await readBody(event)
    const { status, pontosAprovados, observacao } = body
    
    // Validar status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw createError({
        statusCode: 400,
        message: 'Status inválido. Deve ser: pending, approved ou rejected'
      })
    }

    // Buscar título
    const title = await prisma.title.findUnique({
      where: { id: titleId },
      include: { candidate: true }
    })

    if (!title) {
      throw createError({
        statusCode: 404,
        message: 'Título não encontrado'
      })
    }

    // Atualizar título com validação
    const updatedTitle = await prisma.title.update({
      where: { id: titleId },
      data: {
        status,
        pontosAprovados: status === 'approved' && pontosAprovados !== undefined ? pontosAprovados : null,
        observacao: observacao || null,
        validadoPor: status !== 'pending' ? session.username : null,
        validadoEm: status !== 'pending' ? new Date() : null
      }
    })

    console.log(`Título ${titleId} validado por ${session.username}: status=${status}, pontos=${pontosAprovados || 'automático'}`)

    return {
      success: true,
      message: `Título ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'marcado como pendente'}`,
      data: updatedTitle
    }

  } catch (error: any) {
    console.error('Erro ao validar título:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Erro interno do servidor'
    })
  }
})
