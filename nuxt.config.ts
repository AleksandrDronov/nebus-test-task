export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: ['~/assets/styles/main.scss'],
  typescript: {
    strict: true
  },
  app: {
    head: {
      title: 'Заметки',
      htmlAttrs: {
        lang: 'ru'
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Приложение для заметок' }
      ]
    }
  },
  nitro: {
    preset: 'static'
  }
})
