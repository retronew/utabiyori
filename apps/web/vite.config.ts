import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import handle from '@jp-learn/api/handler'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(
    mode,
    fileURLToPath(new URL('../../', import.meta.url)),
    '',
  )
  return {
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'netease-development-api',
        configureServer(server) {
          server.middlewares.use('/api/netease', (req, res) => {
            void handle(req, res, env)
          })
        },
      },
    ],
  }
})
