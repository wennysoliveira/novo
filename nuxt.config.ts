// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-10-28',
  nitro: {
    // Compressão de assets públicos para melhor performance
    compressPublicAssets: true
  },
  experimental: {
    // Desabilitar watchers em produção para melhor performance
    watcher: process.env.NODE_ENV === 'production' ? false : undefined
  },
  runtimeConfig: {
    // Private keys (only available on server-side)
    jwtSecret: process.env.JWT_SECRET || 'sua-chave-secreta-padrao',
    adminDefaultUser: process.env.ADMIN_DEFAULT_USER || 'admin',
    adminDefaultPass: process.env.ADMIN_DEFAULT_PASS || 'admin123',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    // Public keys (exposed to client-side)
    public: {
      apiBase: '/api'
    }
  }
})
