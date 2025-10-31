import { prisma } from './database'

type SessionRecord = {
  username: string
  lastActive: number
}

// Aumentar tempo de sessão para 30 minutos em produção
const FIVE_MINUTES_MS = 30 * 60 * 1000 // 30 minutos

export const SESSION_COOKIE_NAME = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 30 * 60 // 30 minutos
export const SESSION_MAX_AGE_MS = FIVE_MINUTES_MS

export async function createSession(sessionId: string, username: string): Promise<void> {
  try {
    await prisma.adminSession.upsert({
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
  } catch (error) {
    console.error('Erro ao criar sessão no banco:', error)
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
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return null
  }
}

export async function touchSession(sessionId: string): Promise<void> {
  try {
    await prisma.adminSession.update({
      where: { sessionId },
      data: { lastActive: new Date() }
    }).catch(() => {
      // Sessão não existe, ignorar
    })
  } catch (error) {
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
  } catch (error) {
    console.error('Erro ao contar sessões:', error)
    return 0
  }
}


