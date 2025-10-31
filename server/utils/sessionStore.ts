import { prisma } from './database'

type SessionRecord = {
  username: string
  lastActive: number
}

// Tempo de sessão: 2 horas para garantir persistência
// Isso evita que sessões sejam perdidas durante uso normal
const FIVE_MINUTES_MS = 2 * 60 * 60 * 1000 // 2 horas

export const SESSION_COOKIE_NAME = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 2 * 60 * 60 // 2 horas
export const SESSION_MAX_AGE_MS = FIVE_MINUTES_MS

export async function createSession(sessionId: string, username: string): Promise<void> {
  try {
    const result = await prisma.adminSession.upsert({
      where: { sessionId },
      update: {
        username,
        lastActive: new Date()
      },
      create: {
        sessionId,
        username,
        lastActive: new Date()
      }
    })
    console.log(`Sessão ${sessionId.substring(0, 8)}... salva no banco de dados (ID: ${result.id})`)
  } catch (error: any) {
    console.error('Erro ao criar sessão no banco:', error)
    // Se a tabela não existir, tentar criar
    if (error?.code === 'P2021' || error?.code === 'P2003' || error?.message?.includes('does not exist') || error?.message?.includes('no such table')) {
      console.error('ERRO CRÍTICO: Tabela admin_sessions não existe. Execute as migrações do Prisma.')
      throw new Error('Tabela de sessões não encontrada. Execute as migrações do banco de dados.')
    }
    // Re-throw para que o erro seja tratado no login
    throw error
  }
}

export async function getSession(sessionId: string | undefined | null): Promise<SessionRecord | null> {
  if (!sessionId) return null
  
  try {
    const record = await prisma.adminSession.findUnique({
      where: { sessionId }
    })
    
    if (!record) return null
    
    return {
      username: record.username,
      lastActive: record.lastActive.getTime()
    }
  } catch (error: any) {
    console.error('Erro ao buscar sessão:', error)
    // Se a tabela não existir, retornar null silenciosamente
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.log('AVISO: Tabela admin_sessions não existe. Execute as migrações do Prisma.')
      return null
    }
    return null
  }
}

export async function touchSession(sessionId: string): Promise<void> {
  try {
    await prisma.adminSession.update({
      where: { sessionId },
      data: { lastActive: new Date() }
    })
    // Sessão renovada com sucesso
  } catch (error: any) {
    // Se a sessão não existir ou tabela não existir, não é crítico
    if (error?.code === 'P2025' || error?.code === 'P2021') {
      // Sessão não encontrada ou tabela não existe
      return
    }
    console.error('Erro ao atualizar sessão:', error)
  }
}

export async function destroySession(sessionId: string | undefined | null): Promise<void> {
  if (!sessionId) return
  
  try {
    await prisma.adminSession.delete({
      where: { sessionId }
    }).catch(() => {
      // Sessão não existe, ignorar
    })
  } catch (error) {
    console.error('Erro ao destruir sessão:', error)
  }
}

export function isSessionExpired(record: SessionRecord): boolean {
  return Date.now() - record.lastActive > FIVE_MINUTES_MS
}

// Limpar sessões expiradas (executar periodicamente)
export async function cleanupExpiredSessions(): Promise<void> {
  const expiryTime = new Date(Date.now() - FIVE_MINUTES_MS)
  try {
    await prisma.adminSession.deleteMany({
      where: {
        lastActive: {
          lt: expiryTime
        }
      }
    })
  } catch (error) {
    console.error('Erro ao limpar sessões expiradas:', error)
  }
}

// Debug: verificar tamanho da store
export async function getSessionStoreSize(): Promise<number> {
  try {
    return await prisma.adminSession.count()
  } catch (error: any) {
    // Se a tabela não existir, retornar 0
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.log('AVISO: Tabela admin_sessions não existe. Execute as migrações do Prisma.')
      return 0
    }
    console.error('Erro ao contar sessões:', error)
    return 0
  }
}


