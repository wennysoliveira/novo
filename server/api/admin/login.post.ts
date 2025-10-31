import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '~/server/utils/sessionStore'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, username, password } = body || {}

    if ((!email && !username) || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário e senha são obrigatórios'
      })
    }

    const validUsername = 'admin'
    const validPassword = 'sr102030@'

    const isUserOk = (username && username === validUsername) || (email && email === validUsername)
    if (!isUserOk || password !== validPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    const sessionId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    
    try {
      await createSession(sessionId, validUsername)
      console.log('Login: sessão criada com ID:', sessionId.substring(0, 8) + '...')
    } catch (sessionError: any) {
      console.error('ERRO CRÍTICO ao criar sessão:', sessionError)
      if (sessionError?.message?.includes('Tabela de sessões não encontrada')) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro no banco de dados: tabela de sessões não encontrada. Execute as migrações.'
        })
      }
      throw sessionError
    }

    // Configurar cookie com duração de 2 horas
    setCookie(event, SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production' && !process.env.DISABLE_SECURE_COOKIES,
      domain: undefined // Deixar undefined para usar o domínio atual
    })

    console.log('Login: cookie configurado:', SESSION_COOKIE_NAME, 'com valor:', sessionId.substring(0, 8) + '...')
    console.log('Login: cookie expira em', SESSION_MAX_AGE_SECONDS, 'segundos (', Math.floor(SESSION_MAX_AGE_SECONDS / 3600), 'horas)')

    return { 
      success: true, 
      sessionId: sessionId.substring(0, 8) + '...',
      expiresIn: SESSION_MAX_AGE_SECONDS
    }
  } catch (error: any) {
    console.error('Erro no login:', error)
    if (error?.statusCode) throw error
    throw createError({ 
      statusCode: 500, 
      statusMessage: error?.message || 'Erro interno do servidor' 
    })
  }
})
