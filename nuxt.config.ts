// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@nuxt/ui'],

  runtimeConfig: {
    pocketbaseUrl: process.env.NUXT_POCKETBASE_URL,
    public: {
      apiBase: '/'
    }
  },

  routeRules: {
    '/api/**': {
      proxy: `${process.env.NUXT_POCKETBASE_URL}/api/**`
    }
  },

  ui: {
    fonts: false,
  },

  css: ['~/assets/css/app.css'],
})
