import { prisma } from '~/server/utils/database'
import { saveFile } from '~/server/utils/fileHandler'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dados do formulário não encontrados'
      })
    }

    // Extrair dados do formulário
    const formDataObj: Record<string, any> = {}
    const files: Record<string, { buffer: Buffer; mimeType: string; filename: string }> = {}
    
    for (const field of formData) {
      if (field.data) {
        if (field.filename) {
          // É um arquivo
          files[field.name] = {
            buffer: field.data,
            mimeType: field.type || 'application/octet-stream',
            filename: field.filename
          }
        } else {
          // É um campo de texto
          formDataObj[field.name] = field.data.toString()
        }
      }
    }

    // Construir dados sem validações (com defaults seguros)
    const fallbackId = randomUUID().slice(0, 8)
    const nomeCompleto = formDataObj.nomeCompleto ?? ''
    // Normalizar CPF: remover todos os caracteres não numéricos
    const cpfRaw = formDataObj.cpf && String(formDataObj.cpf).trim() !== ''
      ? String(formDataObj.cpf)
      : `temp-${fallbackId}`
    const cpf = cpfRaw.replace(/\D/g, '') // Remove caracteres não numéricos
    const email = formDataObj.email && String(formDataObj.email).trim() !== ''
      ? String(formDataObj.email)
      : `temp-${fallbackId}@example.com`
    const telefone = formDataObj.telefone ?? ''
    const unidadeEnsino = formDataObj.unidadeEnsino ?? ''
    const funcaoAtual = formDataObj.funcaoAtual ?? ''
    const formacaoAcademica = formDataObj.formacaoAcademica ?? ''
    const tempoExperienciaGestao = Number.parseInt(formDataObj.tempoExperienciaGestao ?? '0') || 0
    const sexo = formDataObj.sexo ?? null

    // Verificar se CPF já existe (evitar duplicatas)
    // CPF já está normalizado acima
    if (cpf && cpf.length >= 11 && cpf !== `temp${fallbackId}`.replace(/\D/g, '')) {
      console.log(`Verificando se CPF ${cpf} já existe...`)
      
      // Buscar candidato existente com CPF normalizado
      const existingCandidate = await prisma.candidate.findUnique({
        where: { cpf }
      })
      
      // Se não encontrou diretamente, buscar todos e comparar CPFs normalizados
      if (!existingCandidate) {
        const allCandidates = await prisma.candidate.findMany({
          select: { id: true, cpf: true }
        })
        
        // Comparar CPFs normalizados
        const found = allCandidates.find(c => {
          const existingCpfNormalized = String(c.cpf).replace(/\D/g, '')
          return existingCpfNormalized === cpf && existingCpfNormalized.length >= 11
        })
        
        if (found) {
          const protocoloExistente = `SEG-${found.id.slice(-8).toUpperCase()}`
          console.log(`CPF ${cpf} já cadastrado (normalizado). Protocolo existente: ${protocoloExistente}`)
          
          throw createError({
            statusCode: 400,
            statusMessage: `Este CPF já está cadastrado. Protocolo da inscrição anterior: ${protocoloExistente}. Entre em contato caso tenha dúvidas.`
          })
        }
      } else {
        // CPF encontrado diretamente
        const protocoloExistente = `SEG-${existingCandidate.id.slice(-8).toUpperCase()}`
        console.log(`CPF ${cpf} já cadastrado. Protocolo existente: ${protocoloExistente}`)
        
        throw createError({
          statusCode: 400,
          statusMessage: `Este CPF já está cadastrado. Protocolo da inscrição anterior: ${protocoloExistente}. Entre em contato caso tenha dúvidas.`
        })
      }
    }

    // Verificar se email já existe
    if (email && email !== `temp-${fallbackId}@example.com`) {
      const existingByEmail = await prisma.candidate.findUnique({
        where: { email }
      })
      
      if (existingByEmail && existingByEmail.cpf !== cpf) {
        // Email já existe com outro CPF
        throw createError({
          statusCode: 400,
          statusMessage: 'Este e-mail já está cadastrado com outro CPF'
        })
      }
    }

    // Criar candidato e documentos em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar candidato (CPF já está normalizado)
      const candidate = await tx.candidate.create({
        data: {
          nomeCompleto,
          cpf, // CPF já normalizado (apenas números)
          email,
          telefone,
          unidadeEnsino,
          funcaoAtual,
          formacaoAcademica,
          tempoExperienciaGestao,
          sexo
        }
      })

      // Salvar todos os arquivos enviados como documentos (sem validação)
      const documents = [] as any[]
      for (const [key, file] of Object.entries(files)) {
        const { filepath, filename } = await saveFile(file, cpf || 'sem_cpf', key)
        const document = await tx.document.create({
          data: {
            type: key,
            filename,
            filepath,
            mimeType: file.mimeType,
            size: file.buffer.length,
            candidateId: candidate.id
          }
        })
        documents.push(document)
      }

      // Não criar títulos automaticamente sem validação
      const titles: any[] = []

      return { candidate, documents, titles }
    })

    // Gerar número de protocolo
    const protocolo = `SEG-${result.candidate.id.slice(-8).toUpperCase()}`

    return {
      success: true,
      message: 'Inscrição realizada com sucesso!',
      protocolo,
      candidateId: result.candidate.id,
      documentsCount: result.documents.length,
      titlesCount: result.titles.length
    }

  } catch (error: any) {
    console.error('Erro na inscrição:', error)
    
    // Tratar erro de constraint única (CPF ou email duplicado)
    if (error.code === 'P2002') {
      const target = error.meta?.target || []
      
      if (target.includes('cpf')) {
        // CPF duplicado - buscar candidato existente pelo CPF que tentamos criar
        console.log(`Erro P2002: CPF duplicado. Buscando candidato existente com CPF: ${cpf}`)
        
        try {
          const existingCandidate = await prisma.candidate.findUnique({
            where: { cpf }
          })
          
          if (existingCandidate) {
            const protocoloExistente = `SEG-${existingCandidate.id.slice(-8).toUpperCase()}`
            console.log(`CPF ${cpf} já cadastrado. Retornando protocolo existente: ${protocoloExistente}`)
            
            return {
              success: true,
              message: 'Inscrição já existe. Retornando protocolo da inscrição anterior.',
              protocolo: protocoloExistente,
              candidateId: existingCandidate.id,
              alreadyExists: true,
              documentsCount: 0,
              titlesCount: 0
            }
          }
        } catch (lookupError) {
          console.error('Erro ao buscar candidato existente:', lookupError)
        }
        
        throw createError({
          statusCode: 400,
          statusMessage: 'Este CPF já está cadastrado'
        })
      }
      
      if (target.includes('email')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Este e-mail já está cadastrado'
        })
      }
    }
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
