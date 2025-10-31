import { prisma } from '~/server/utils/database'
import { getSession, isSessionExpired, touchSession, SESSION_COOKIE_NAME, getSessionStoreSize } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  try {
    // Verificar autenticação
    const sessionId = getCookie(event, SESSION_COOKIE_NAME)
    
    // Debug: verificar todos os cookies recebidos
    const allCookies = getCookie(event)
    console.log('Todos os cookies recebidos:', Object.keys(allCookies || {}))
    console.log('Verificando sessão - sessionId:', sessionId ? `presente (${sessionId.substring(0, 8)}...)` : 'ausente')
    console.log('Tamanho da session store:', getSessionStoreSize())
    
    if (!sessionId) {
      console.log('ERRO: Cookie admin_session não encontrado')
      throw createError({
        statusCode: 401,
        message: 'Não autorizado - sessão não encontrada'
      })
    }
    
    const session = getSession(sessionId)
    
    console.log('Sessão encontrada:', session ? 'sim' : 'não')
    
    if (!session) {
      console.log('ERRO: Sessão não encontrada na store para ID:', sessionId.substring(0, 8))
      throw createError({
        statusCode: 401,
        message: 'Não autorizado - sessão inválida'
      })
    }
    
    if (isSessionExpired(session)) {
      console.log('ERRO: Sessão expirada')
      throw createError({
        statusCode: 401,
        message: 'Não autorizado - sessão expirada'
      })
    }
    
    // Renovar sessão
    touchSession(sessionId)

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const search = query.search as string || ''
    const skip = (page - 1) * limit

    // Construir filtros de busca
    const where: any = {}
    
    if (search) {
      where.OR = [
        { nomeCompleto: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Buscar inscrições com paginação
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          documents: {
            select: { type: true, filename: true }
          },
          titles: {
            select: { type: true, value: true }
          },
          managementPlan: {
            select: { filename: true, uploadedAt: true }
          },
          _count: {
            select: {
              documents: true,
              titles: true
            }
          }
        }
      }),
      prisma.candidate.count({ where })
    ])

    // Calcular pontuação de títulos para cada candidato
    const candidatesWithScore = candidates.map(candidate => {
      let score = 0
      
      // Pontuação por formação acadêmica
      if (candidate.formacaoAcademica === 'Doutorado') score += 15
      else if (candidate.formacaoAcademica === 'Mestrado') score += 10
      else if (candidate.formacaoAcademica === 'Especialização') score += 5
      
      // Pontuação por tempo de magistério (1 ponto por ano, máximo 20)
      const tempoMagisterio = candidate.titles.find(t => t.type === 'tempo_magisterio')?.value || 0
      score += Math.min(tempoMagisterio, 20)
      
      // Pontuação por experiência em gestão (3 pontos por ano, máximo 10)
      const experienciaGestao = candidate.titles.find(t => t.type === 'experiencia_gestao')?.value || 0
      score += Math.min(experienciaGestao * 3, 30)
      
      // Pontuação por cursos de formação (1 ponto por curso, máximo 20)
      const cursosFormacao = candidate.titles.filter(t => t.type === 'cursos_formacao').length
      score += Math.min(cursosFormacao, 20)

      return {
        ...candidate,
        score
      }
    })

    return {
      success: true,
      data: candidatesWithScore,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

  } catch (error: any) {
    console.error('Erro ao buscar inscrições:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
