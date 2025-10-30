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
    const cpf = formDataObj.cpf && String(formDataObj.cpf).trim() !== ''
      ? String(formDataObj.cpf)
      : `temp-${fallbackId}`
    const email = formDataObj.email && String(formDataObj.email).trim() !== ''
      ? String(formDataObj.email)
      : `temp-${fallbackId}@example.com`
    const telefone = formDataObj.telefone ?? ''
    const unidadeEnsino = formDataObj.unidadeEnsino ?? ''
    const funcaoAtual = formDataObj.funcaoAtual ?? ''
    const formacaoAcademica = formDataObj.formacaoAcademica ?? ''
    const tempoExperienciaGestao = Number.parseInt(formDataObj.tempoExperienciaGestao ?? '0') || 0
    const sexo = formDataObj.sexo ?? null

    // Criar candidato e documentos em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar candidato
      const candidate = await tx.candidate.create({
        data: {
          nomeCompleto,
          cpf,
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
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
