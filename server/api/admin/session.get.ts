import { getSession, isSessionExpired, touchSession, destroySession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME)
  const record = await getSession(sessionId)

  if (!record) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }

  if (isSessionExpired(record)) {
    await destroySession(sessionId)
    deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })
    throw createError({ statusCode: 401, statusMessage: 'Sessão expirada' })
  }

  await touchSession(sessionId!)

  setCookie(event, SESSION_COOKIE_NAME, sessionId!, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production'
  })

  return { ok: true }
})


