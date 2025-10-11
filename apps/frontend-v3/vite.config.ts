import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'blue',    // MITRE blue
          neutral: 'slate'
        }
      }
    })
  ],

  server: {
    port: 8081,
    proxy: {
      // Proxy API calls to NestJS backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/authn': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/authz': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@heimdall/common': path.resolve(__dirname, '../../libs/common/src')
    }
  },

  build: {
    outDir: '../../dist/frontend-v3',
    sourcemap: true
  }
})
