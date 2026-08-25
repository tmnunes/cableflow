import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  handleWorkspaceRequest,
  isAllowedOrigin,
  isRateLimited,
  parseWorkspaceBody,
} from './api/_lib/workspaceSync.ts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function workspaceDevApiPlugin(mode: string): Plugin {
  return {
    name: 'workspace-dev-api',
    configureServer(server) {
      const env = loadEnv(mode, rootDir, '')
      for (const [key, value] of Object.entries(env)) {
        if (!process.env[key]) process.env[key] = value
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/workspace')) return next()

        const origin = req.headers.origin
        if (!isAllowedOrigin(origin)) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'forbidden_origin' }))
          return
        }

        const clientIp = req.socket.remoteAddress ?? 'unknown'
        if (isRateLimited(clientIp)) {
          res.statusCode = 429
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'rate_limited' }))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.setHeader('Access-Control-Allow-Origin', origin ?? '*')
          res.setHeader('Access-Control-Allow-Headers', 'content-type')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.end()
          return
        }

        try {
          if (req.method === 'GET') {
            const parsed = new URL(url, 'http://localhost')
            const action = parsed.searchParams.get('action') ?? 'health'
            const { status, json } = await handleWorkspaceRequest({
              action: action as 'health',
            })
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(json))
            return
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'method_not_allowed' }))
            return
          }

          const raw = await readBody(req)
          const body = parseWorkspaceBody(raw)
          if (!body) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_json' }))
            return
          }

          const { status, json } = await handleWorkspaceRequest(body)
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(json))
        } catch (err) {
          console.error('[workspace-dev-api]', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'internal_error' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), workspaceDevApiPlugin(mode)],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
}))
