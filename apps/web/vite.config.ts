import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import handle from '@jp-learn/api/handler'
import handleAccount from '@jp-learn/api/account-handler'
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
          for (const prefix of ['/api/auth', '/api/account']) {
            server.middlewares.use(prefix, (req, res) => {
              // Connect strips the mount prefix; the shared handler needs the full path.
              const url = req.url
              req.url = req.originalUrl
              void handleAccount(req, res, env).finally(() => {
                req.url = url
              })
            })
          }
          server.middlewares.use('/api/netease', (req, res) => {
            void handle(req, res, env)
          })
        },
      },
    ],
  }
})
