export default defineNuxtConfig({
  // Composed as a host would: the authentication layer and Theme Manager as peers.
  extends: ['..', '@nuxt-layers/theme-manager'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-06-30',
})
