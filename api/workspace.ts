import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  corsHeaders,
  handleWorkspaceRequest,
  isAllowedOrigin,
  isRateLimited,
  parseWorkspaceBody,
} from './_lib/workspaceSync'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const origin = req.headers.origin

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', origin ?? '*')
      res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
      res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods'])
      return res.status(204).end()
    }

    if (!isAllowedOrigin(origin)) {
      return res.status(403).json({ error: 'forbidden_origin' })
    }

    res.setHeader('Access-Control-Allow-Origin', origin ?? '*')

    const clientIp =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : null) ?? 'unknown'

    if (isRateLimited(clientIp)) {
      return res.status(429).json({ error: 'rate_limited' })
    }

    if (req.method === 'GET') {
      const action = typeof req.query.action === 'string' ? req.query.action : 'health'
      const { status, json } = await handleWorkspaceRequest({ action: action as 'health' })
      return res.status(status).json(json)
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method_not_allowed' })
    }

    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
    const body = parseWorkspaceBody(raw)
    if (!body) {
      return res.status(400).json({ error: 'invalid_json' })
    }

    const { status, json } = await handleWorkspaceRequest(body)
    return res.status(status).json(json)
  } catch (err) {
    console.error('[api/workspace]', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
