/**
 * CableFlow workspace sync — server-side only (service role never in browser).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MAX_BODY_BYTES = 5 * 1024 * 1024 // 5 MB

type Action = 'create' | 'get' | 'put' | 'health'

export type WorkspaceRequestBody = {
  action?: Action
  code?: string
  payload?: unknown
}

export type WorkspaceJsonResponse = {
  ok?: boolean
  configured?: boolean
  code?: string
  updatedAt?: string
  payload?: unknown
  payloadVersion?: number
  error?: string
}

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value)
}

function getEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value || null
}

export function isWorkspaceBackendConfigured(): boolean {
  return Boolean(getEnv('SUPABASE_URL') && getEnv('SUPABASE_SERVICE_ROLE_KEY'))
}

async function rest(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<Response> {
  const base = getEnv('SUPABASE_URL')!.replace(/\/$/, '')
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')!
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (init.prefer) headers.Prefer = init.prefer
  return fetch(`${base}/rest/v1/${path}`, { ...init, headers })
}

export async function handleWorkspaceRequest(
  body: WorkspaceRequestBody,
): Promise<{ status: number; json: WorkspaceJsonResponse }> {
  if (!isWorkspaceBackendConfigured()) {
    return { status: 503, json: { error: 'not_configured' } }
  }

  const action = body.action

  if (action === 'health') {
    return { status: 200, json: { ok: true, configured: true } }
  }

  const code = typeof body.code === 'string' ? body.code.trim() : ''

  if (!action || !['create', 'get', 'put'].includes(action)) {
    return { status: 400, json: { error: 'invalid_action' } }
  }

  if (!code || !isValidUuid(code)) {
    return { status: 400, json: { error: 'invalid_code' } }
  }

  try {
    if (action === 'create') {
      const payload = body.payload ?? {}
      const now = new Date().toISOString()
      const res = await rest('cableflow_workspaces', {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify({
          id: code,
          payload,
          payload_version:
            typeof (payload as { version?: number })?.version === 'number'
              ? (payload as { version: number }).version
              : 3,
          created_at: now,
          updated_at: now,
          last_access_at: now,
        }),
      })

      if (res.status === 409) {
        return { status: 409, json: { error: 'already_exists' } }
      }
      if (!res.ok) {
        console.error('workspace create failed', res.status, await res.text())
        return { status: 500, json: { error: 'create_failed' } }
      }

      const rows = (await res.json()) as Array<{
        id: string
        updated_at: string
        payload: unknown
      }>
      const row = rows[0]
      return {
        status: 200,
        json: {
          ok: true,
          code: row?.id ?? code,
          updatedAt: row?.updated_at ?? now,
          payload: row?.payload ?? payload,
        },
      }
    }

    if (action === 'get') {
      const res = await rest(
        `cableflow_workspaces?id=eq.${encodeURIComponent(code)}&select=id,payload,payload_version,updated_at`,
        { method: 'GET' },
      )
      if (!res.ok) {
        console.error('workspace get failed', res.status, await res.text())
        return { status: 500, json: { error: 'get_failed' } }
      }
      const rows = (await res.json()) as Array<{
        id: string
        payload: unknown
        payload_version: number
        updated_at: string
      }>
      const row = rows[0]
      if (!row) {
        return { status: 404, json: { error: 'not_found' } }
      }

      void rest(`cableflow_workspaces?id=eq.${encodeURIComponent(code)}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({ last_access_at: new Date().toISOString() }),
      })

      return {
        status: 200,
        json: {
          ok: true,
          code: row.id,
          updatedAt: row.updated_at,
          payloadVersion: row.payload_version,
          payload: row.payload,
        },
      }
    }

    // put
    if (body.payload === undefined || body.payload === null) {
      return { status: 400, json: { error: 'missing_payload' } }
    }

    const now = new Date().toISOString()
    const payload = body.payload
    const res = await rest(`cableflow_workspaces?id=eq.${encodeURIComponent(code)}`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: JSON.stringify({
        payload,
        payload_version:
          typeof (payload as { version?: number })?.version === 'number'
            ? (payload as { version: number }).version
            : 3,
        updated_at: now,
        last_access_at: now,
      }),
    })

    if (!res.ok) {
      console.error('workspace put failed', res.status, await res.text())
      return { status: 500, json: { error: 'put_failed' } }
    }

    const rows = (await res.json()) as Array<{ id: string; updated_at: string }>
    if (!rows[0]) {
      return { status: 404, json: { error: 'not_found' } }
    }

    return {
      status: 200,
      json: { ok: true, code: rows[0].id, updatedAt: rows[0].updated_at },
    }
  } catch (err) {
    console.error(err)
    return { status: 500, json: { error: 'internal_error' } }
  }
}

export function parseWorkspaceBody(raw: string): WorkspaceRequestBody | null {
  if (raw.length > MAX_BODY_BYTES) return null
  try {
    return JSON.parse(raw) as WorkspaceRequestBody
  } catch {
    return null
  }
}

/** Simple sliding-window rate limit per IP (best-effort on serverless). */
const rateBuckets = new Map<string, number[]>()
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 120

export function isRateLimited(clientKey: string): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(clientKey) ?? []
  const recent = bucket.filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_MAX) {
    rateBuckets.set(clientKey, recent)
    return true
  }
  recent.push(now)
  rateBuckets.set(clientKey, recent)
  return false
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return true
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (allowed.length === 0) return true
  return allowed.includes(origin)
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
