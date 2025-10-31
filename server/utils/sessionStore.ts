type SessionRecord = {
  email: string
  lastActive: number
}

// Aumentar tempo de sessão para 30 minutos em produção
const FIVE_MINUTES_MS = 30 * 60 * 1000 // 30 minutos

const sessions = new Map<string, SessionRecord>()

export function createSession(sessionId: string, email: string): void {
  sessions.set(sessionId, { email, lastActive: Date.now() })
}

export function getSession(sessionId: string | undefined | null): SessionRecord | null {
  if (!sessionId) return null
  const record = sessions.get(sessionId)
  return record ?? null
}

export function touchSession(sessionId: string): void {
  const record = sessions.get(sessionId)
  if (!record) return
  record.lastActive = Date.now()
  sessions.set(sessionId, record)
}

export function destroySession(sessionId: string | undefined | null): void {
  if (!sessionId) return
  sessions.delete(sessionId)
}

export function isSessionExpired(record: SessionRecord): boolean {
  return Date.now() - record.lastActive > FIVE_MINUTES_MS
}

export const SESSION_COOKIE_NAME = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 30 * 60 // 30 minutos
export const SESSION_MAX_AGE_MS = FIVE_MINUTES_MS

// Debug: verificar tamanho da store
export function getSessionStoreSize(): number {
  return sessions.size
}


