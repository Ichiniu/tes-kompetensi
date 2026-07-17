// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: "2024-11-01",

  devtools: { enabled: true },

  runtimeConfig: {
    // Server-side only configurations
    apiBaseUrlServer: process.env.API_BASE_URL_SERVER || 'http://backend:3001/api',
    public: {
      appName: process.env.APP_NAME || 'Sistem Kepegawaian',
      appClient: process.env.APP_CLIENT || 'JMC IT Consultant',
      recaptchaSiteKey: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY,
      apiBaseUrl: process.env.API_BASE_URL || '/api'
    },
  },

  modules: [
    '@pinia/nuxt'
  ],


  css: [
    "@tabler/core/dist/css/tabler.min.css",
    "~/assets/css/backend.css",
    "~/assets/css/main.css",
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Sistem Kepegawaian JMC",
      meta: [
        { name: "description", content: "Sistem Kepegawaian dan Kalkulasi Tunjangan Transport" }
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.png" }],
      script: [
        {
          src: "https://www.google.com/recaptcha/api.js",
          async: true,
          defer: true,
        },
      ],
    },
  },

  plugins: [
    "~/plugins/jquery.client.js",
    "~/plugins/tabler.client.js",
  ],

  vite: {
    optimizeDeps: {
      include: ["apexcharts"],
    },
  },
});
