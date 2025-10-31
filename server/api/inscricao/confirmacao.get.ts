import { prisma } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const protocolo = query.protocolo as string
    const candidateId = query.candidateId as string

    if (!protocolo && !candidateId) {
      throw createError({
        statusCode: 400,
        message: 'Protocolo ou ID do candidato é obrigatório'
      })
    }

    let candidate

    if (candidateId) {
      // Buscar pelo ID diretamente
      candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          documents: {
            select: { type: true, filename: true, uploadedAt: true }
          },
          titles: {
            select: { type: true, value: true, description: true }
          },
          _count: {
            select: {
              documents: true,
              titles: true
            }
          }
        }
      })
    } else if (protocolo) {
      // Extrair ID do protocolo (formato: SEG-XXXXXXXX)
      const protocoloId = protocolo.replace('SEG-', '').toLowerCase()
      
      // Buscar candidatos cujo ID termina com o protocolo
      // Como o Prisma não suporta endsWith diretamente em SQLite, vamos buscar todos
      // e filtrar (mas idealmente usar candidateId)
      const candidates = await prisma.candidate.findMany({
        include: {
          documents: {
            select: { type: true, filename: true, uploadedAt: true }
          },
          titles: {
            select: { type: true, value: true, description: true }
          },
          _count: {
            select: {
              documents: true,
              titles: true
            }
          }
        }
      })

      // Encontrar candidato cujo ID termina com o protocolo
      candidate = candidates.find(c => c.id.slice(-8).toLowerCase() === protocoloId)
    }

    if (!candidate) {
      throw createError({
        statusCode: 404,
        message: 'Inscrição não encontrada'
      })
    }

    // Gerar protocolo formatado
    const protocoloFormatado = `SEG-${candidate.id.slice(-8).toUpperCase()}`

    return {
      success: true,
      data: {
        id: candidate.id,
        protocolo: protocoloFormatado,
        nomeCompleto: candidate.nomeCompleto,
        cpf: candidate.cpf,
        email: candidate.email,
        telefone: candidate.telefone,
        unidadeEnsino: candidate.unidadeEnsino,
        funcaoAtual: candidate.funcaoAtual,
        formacaoAcademica: candidate.formacaoAcademica,
        tempoExperienciaGestao: candidate.tempoExperienciaGestao,
        sexo: candidate.sexo,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
        documentsCount: candidate._count.documents,
        titlesCount: candidate._count.titles,
        documents: candidate.documents,
        titles: candidate.titles
      }
    }
  } catch (error: any) {
    console.error('Erro ao buscar dados da inscrição:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Erro interno do servidor'
    })
  }
})

