import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true
  },
  optimizeDeps: {
    include: [
      'jsonjoy-builder',
      'monaco-editor',
      'monaco-editor/esm/vs/editor/editor.api',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/jsonjoy-builder/, /node_modules/],
    },
  },
})
