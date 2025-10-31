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
    const storeSize = await getSessionStoreSize()
    console.log('Tamanho da session store:', storeSize)
    
    if (!sessionId) {
      console.log('ERRO: Cookie admin_session não encontrado')
      throw createError({
        statusCode: 401,
        message: 'Não autorizado - sessão não encontrada'
      })
    }
    
    const session = await getSession(sessionId)
    
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
    await touchSession(sessionId)

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const search = query.search as string || ''
    
    // Se limit for muito alto (>= 1000), buscar todos os registros (para filtros no cliente)
    const shouldFetchAll = limit >= 1000
    const skip = shouldFetchAll ? 0 : (page - 1) * limit
    const take = shouldFetchAll ? undefined : limit

    // Construir filtros de busca
    const where: any = {}
    
    if (search) {
      where.OR = [
        { nomeCompleto: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    console.log('Buscando inscrições - where:', JSON.stringify(where), 'take:', take, 'skip:', skip)

    // Buscar inscrições com paginação
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        ...(skip > 0 && { skip }),
        ...(take && { take }),
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
      // IMPORTANTE: SOMAR todos os títulos de formação acadêmica (doutorado + mestrado + pós-graduação)
      // Considerar apenas títulos APROVADOS ou PENDENTES (rejeitados não pontuam)
      
      // Verificar se há títulos de formação (independente do status)
      const todosTitulosFormacao = candidate.titles.filter(t => 
        ['doutorado', 'mestrado', 'pos_graduacao'].includes(t.type)
      )
      
      // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
      const titulosFormacao = candidate.titles.filter(t => 
        ['doutorado', 'mestrado', 'pos_graduacao'].includes(t.type) && 
        (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
      )
      
      // Somar pontos de todos os títulos de formação acadêmica
      let formacaoPontos = titulosFormacao.reduce((sum, title) => {
        let pontos = 0
        
        // Se aprovado com pontos customizados, usar esse valor
        if (title.status === 'approved' && title.pontosAprovados !== null) {
          pontos = title.pontosAprovados || 0
        }
        // Se aprovado sem pontos customizados ou pendente, usar cálculo automático
        else if (title.type === 'doutorado' && title.filename) {
          pontos = 15
        } else if (title.type === 'mestrado' && title.filename) {
          pontos = 10
        } else if (title.type === 'pos_graduacao' && title.filename) {
          pontos = 5
        }
        
        return sum + pontos
      }, 0)
      
      // Fallback: se não houver títulos de formação mas não forem rejeitados, usar campo formacaoAcademica
      if (formacaoPontos === 0) {
        if (todosTitulosFormacao.length === 0 || !todosTitulosFormacao.some(t => t.status === 'rejected')) {
          if (candidate.formacaoAcademica === 'Doutorado') {
            formacaoPontos = 15
          } else if (candidate.formacaoAcademica === 'Mestrado') {
            formacaoPontos = 10
          } else if (candidate.formacaoAcademica === 'Especialização') {
            formacaoPontos = 5
          }
        }
      }
      
      score += formacaoPontos
      
      // Pontuação por tempo de magistério (considerar apenas títulos aprovados ou pendentes)
      // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
      const tempoMagisterioTitle = candidate.titles.find(t => 
        t.type === 'tempo_magisterio' && 
        (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
      )
      
      let tempoMagisterio = 0
      if (tempoMagisterioTitle) {
        if (tempoMagisterioTitle.status === 'approved' && tempoMagisterioTitle.pontosAprovados !== null) {
          tempoMagisterio = tempoMagisterioTitle.pontosAprovados
        } else {
          tempoMagisterio = tempoMagisterioTitle.value || 0
        }
      }
      score += Math.min(tempoMagisterio, 20)
      
      // Pontuação por experiência em gestão (considerar apenas títulos aprovados ou pendentes)
      // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
      const experienciaGestaoTitle = candidate.titles.find(t => 
        t.type === 'experiencia_gestao' && 
        (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
      )
      
      let experienciaGestao = 0
      if (experienciaGestaoTitle) {
        if (experienciaGestaoTitle.status === 'approved' && experienciaGestaoTitle.pontosAprovados !== null) {
          experienciaGestao = experienciaGestaoTitle.pontosAprovados
        } else {
          experienciaGestao = experienciaGestaoTitle.value || 0
          if (experienciaGestao === 0 && experienciaGestaoTitle.filename && candidate.tempoExperienciaGestao > 0) {
            experienciaGestao = candidate.tempoExperienciaGestao
          }
        }
      }
      score += Math.min(experienciaGestao * 3, 30)
      
      // Pontuação por cursos de formação (considerar apenas títulos aprovados ou pendentes)
      const cursosFormacaoAprovados = candidate.titles.filter(t => 
        t.type === 'cursos_formacao' && 
        (t.status === 'approved' || t.status === 'pending')
      )
      
      const pontosCursosAprovados = cursosFormacaoAprovados
        .filter(t => t.status === 'approved' && t.pontosAprovados !== null)
        .reduce((sum, t) => sum + (t.pontosAprovados || 0), 0)
      
      const cursosPendentes = cursosFormacaoAprovados.filter(t => t.status === 'pending').length
      score += Math.min(pontosCursosAprovados + cursosPendentes, 20)

      return {
        ...candidate,
        score
      }
    })

    console.log('Inscrições encontradas:', candidates.length, 'Total no banco:', total)

    return {
      success: true,
      data: candidatesWithScore,
      pagination: {
        page,
        limit: shouldFetchAll ? total : limit,
        total,
        totalPages: Math.ceil(total / (shouldFetchAll ? total : limit))
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
