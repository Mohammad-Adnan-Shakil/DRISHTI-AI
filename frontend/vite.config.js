import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['drishti-logo.png', 'favicon.svg'],
      manifest: {
        name: 'DRISHTI Clinical AI',
        short_name: 'DRISHTI',
        description: 'Explainable AI for Diabetic Retinopathy Screening in Rural India',
        theme_color: '#1a5c2e',
        background_color: '#F8FAF7',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/drishti-logo.png',
            sizes: '192x192 512x512',
            type: 'image/png'
          },
          {
            src: '/drishti-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  }
})