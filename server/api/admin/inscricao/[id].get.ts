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
        statusMessage: 'Não autorizado'
      })
    }
    
    await touchSession(sessionId!)

    const candidateId = getRouterParam(event, 'id')
    
    if (!candidateId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do candidato é obrigatório'
      })
    }

    // Buscar candidato com todos os dados relacionados
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        documents: {
          orderBy: { uploadedAt: 'asc' }
        },
        titles: {
          orderBy: { uploadedAt: 'asc' }
        },
        managementPlan: true,
        resources: {
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    if (!candidate) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Candidato não encontrado'
      })
    }

    // Calcular pontuação detalhada
    let score = 0
    const scoreDetails = {
      formacao: 0,
      tempoMagisterio: 0,
      experienciaGestao: 0,
      cursosFormacao: 0,
      total: 0
    }

    // Pontuação por formação acadêmica
    // IMPORTANTE: SOMAR todos os títulos de formação acadêmica (doutorado + mestrado + pós-graduação)
    // Considerar apenas títulos APROVADOS ou PENDENTES (rejeitados não pontuam)
    let formacaoPontos = 0
    
    // Verificar se há títulos de formação (independente do status)
    const todosTitulosFormacao = candidate.titles.filter(t => 
      ['doutorado', 'mestrado', 'pos_graduacao'].includes(t.type)
    )
    
    // Buscar títulos aprovados ou pendentes de formação acadêmica
    // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
    const titulosFormacao = candidate.titles.filter(t => 
      ['doutorado', 'mestrado', 'pos_graduacao'].includes(t.type) && 
      (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
    )
    
    // Somar pontos de todos os títulos de formação acadêmica
    formacaoPontos = titulosFormacao.reduce((sum, title) => {
      let pontos = 0
      
      // Se aprovado com pontos customizados, usar esse valor
      if (title.status === 'approved' && title.pontosAprovados !== null) {
        pontos = title.pontosAprovados || 0
      }
      // Se aprovado sem pontos customizados, pendente ou NULL, usar cálculo automático
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
    // IMPORTANTE: Para inscrições antigas que não têm registros na tabela titles
    if (formacaoPontos === 0) {
      const algumRejeitado = todosTitulosFormacao.some(t => t.status === 'rejected')
      
      // Se não há títulos OU se há títulos mas nenhum foi rejeitado, usar fallback
      if (todosTitulosFormacao.length === 0 || !algumRejeitado) {
        console.log(`[${candidateId}] DEBUG - Usando fallback para formacaoAcademica:`, candidate.formacaoAcademica)
        if (candidate.formacaoAcademica === 'Doutorado') {
          formacaoPontos = 15
        } else if (candidate.formacaoAcademica === 'Mestrado') {
          formacaoPontos = 10
        } else if (candidate.formacaoAcademica === 'Especialização') {
          formacaoPontos = 5
        }
      }
    }
    
    console.log(`[${candidateId}] DEBUG - Pontos de formação calculados:`, formacaoPontos)
    
    scoreDetails.formacao = formacaoPontos
    
    score += formacaoPontos

    // Pontuação por tempo de magistério (considerar apenas títulos aprovados ou pendentes)
    // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
    const tempoMagisterioTitle = candidate.titles.find(t => 
      t.type === 'tempo_magisterio' && 
      (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
    )
    
    let tempoMagisterio = 0
    if (tempoMagisterioTitle) {
      // Se aprovado com pontosAprovados, usar esse valor
      if (tempoMagisterioTitle.status === 'approved' && tempoMagisterioTitle.pontosAprovados !== null) {
        tempoMagisterio = tempoMagisterioTitle.pontosAprovados
      } else {
        // Senão, calcular automaticamente
        tempoMagisterio = tempoMagisterioTitle.value || 0
      }
    }
    // FALLBACK: Se não há título mas o candidato tem dados (inscrições antigas sem títulos)
    // Nota: Para inscrições antigas, não temos campo direto de tempo de magistério no Candidate
    // Então só pontua se houver título
    
    scoreDetails.tempoMagisterio = Math.min(tempoMagisterio, 20)
    score += scoreDetails.tempoMagisterio
    console.log(`[${candidateId}] DEBUG - Pontos de tempo de magistério:`, scoreDetails.tempoMagisterio)

    // Pontuação por experiência em gestão (3 pontos por ano, máximo 10 anos = 30 pontos)
    // Considerar apenas títulos aprovados ou pendentes
    // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
    const experienciaGestaoTitle = candidate.titles.find(t => 
      t.type === 'experiencia_gestao' && 
      (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
    )
    
    let experienciaGestao = 0
    if (experienciaGestaoTitle) {
      // Se aprovado com pontosAprovados, usar esse valor
      if (experienciaGestaoTitle.status === 'approved' && experienciaGestaoTitle.pontosAprovados !== null) {
        experienciaGestao = experienciaGestaoTitle.pontosAprovados
      } else {
        // Senão, calcular automaticamente
        experienciaGestao = experienciaGestaoTitle.value || 0
        
        // Fallback: se não tem título com value mas tem arquivo E o campo do candidato tem valor, usar o campo
        if (experienciaGestao === 0 && experienciaGestaoTitle.filename && candidate.tempoExperienciaGestao > 0) {
          experienciaGestao = candidate.tempoExperienciaGestao
        }
      }
    } else {
      // FALLBACK: Se não há título mas o candidato tem tempoExperienciaGestao (inscrições antigas)
      // Calcular pontos baseado no campo direto do candidato
      if (candidate.tempoExperienciaGestao > 0) {
        experienciaGestao = candidate.tempoExperienciaGestao
      }
    }
    
    scoreDetails.experienciaGestao = Math.min(experienciaGestao * 3, 30) // 3 pontos × 10 anos máximo = 30 pontos
    score += scoreDetails.experienciaGestao
    console.log(`[${candidateId}] DEBUG - Pontos de experiência em gestão:`, scoreDetails.experienciaGestao, `(anos: ${experienciaGestao})`)

    // Pontuação por cursos de formação (considerar apenas títulos aprovados ou pendentes)
    // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
    const cursosFormacaoAprovados = candidate.titles.filter(t => 
      t.type === 'cursos_formacao' && 
      (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
    )
    
    // Se algum curso foi aprovado com pontosAprovados, somar esses valores
    const pontosCursosAprovados = cursosFormacaoAprovados
      .filter(t => t.status === 'approved' && t.pontosAprovados !== null)
      .reduce((sum, t) => sum + (t.pontosAprovados || 0), 0)
    
    // Contar cursos pendentes (que ainda não foram validados)
    const cursosPendentes = cursosFormacaoAprovados.filter(t => t.status === 'pending').length
    
    // Pontos = pontos aprovados manualmente + 1 ponto por curso pendente (cálculo automático)
    scoreDetails.cursosFormacao = Math.min(pontosCursosAprovados + cursosPendentes, 20)
    score += scoreDetails.cursosFormacao

    scoreDetails.total = score
    
    console.log(`[${candidateId}] DEBUG - Score final:`, scoreDetails)

    return {
      success: true,
      data: {
        ...candidate,
        scoreDetails
      }
    }

  } catch (error: any) {
    console.error('Erro ao buscar detalhes do candidato:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
