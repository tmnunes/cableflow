import type { AppData } from '@/types/app'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const API_PATH = '/api/workspace'

let cloudConfiguredCache: boolean | null = null

export function isValidWorkspaceCode(code: string): boolean {
  return UUID_RE.test(code.trim())
}

/** Always returns a UUID (workspace secret). */
export function createWorkspaceCode(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Probes same-origin API — no Supabase keys in the browser. Never caches failures. */
export async function probeCloudConfigured(force = false): Promise<boolean> {
  if (!force && cloudConfiguredCache === true) return true
  try {
    const res = await fetch(`${API_PATH}?action=health`, { method: 'GET' })
    if (!res.ok) {
      cloudConfiguredCache = false
      return false
    }
    const json = (await res.json()) as { configured?: boolean; ok?: boolean }
    const ok = Boolean(json.ok && json.configured)
    cloudConfiguredCache = ok
    return ok
  } catch {
    cloudConfiguredCache = false
    return false
  }
}

/** Sync calls same-origin /api/workspace — secrets stay on the server. */
export function isCloudConfigured(): boolean {
  return cloudConfiguredCache === true
}

export function resetCloudConfiguredCache(): void {
  cloudConfiguredCache = null
}

export type CloudSyncError =
  | 'not_configured'
  | 'network'
  | 'invalid_code'
  | 'not_found'
  | 'already_exists'
  | 'server'
  | 'rate_limited'

export type CloudResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CloudSyncError }

interface WorkspaceResponse {
  ok?: boolean
  code?: string
  updatedAt?: string
  payload?: AppData
  error?: string
}

function mapHttpError(status: number, json: WorkspaceResponse): CloudSyncError {
  if (status === 503 || json.error === 'not_configured') return 'not_configured'
  if (status === 404 || json.error === 'not_found') return 'not_found'
  if (status === 409 || json.error === 'already_exists') return 'already_exists'
  if (status === 400 && json.error === 'invalid_code') return 'invalid_code'
  if (status === 429 || json.error === 'rate_limited') return 'rate_limited'
  return 'server'
}

async function callWorkspace(
  body: Record<string, unknown>,
): Promise<CloudResult<WorkspaceResponse>> {
  if (!isCloudConfigured()) {
    return { ok: false, error: 'not_configured' }
  }

  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    let json: WorkspaceResponse = {}
    try {
      json = (await res.json()) as WorkspaceResponse
    } catch {
      // ignore
    }

    if (!res.ok) {
      return { ok: false, error: mapHttpError(res.status, json) }
    }

    return { ok: true, data: json }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export async function cloudCreateWorkspace(
  code: string,
  payload: AppData,
): Promise<CloudResult<{ code: string; updatedAt: string }>> {
  const result = await callWorkspace({ action: 'create', code, payload })
  if (!result.ok) return result
  return {
    ok: true,
    data: {
      code: result.data.code ?? code,
      updatedAt: result.data.updatedAt ?? new Date().toISOString(),
    },
  }
}

export async function cloudGetWorkspace(
  code: string,
): Promise<CloudResult<{ payload: AppData; updatedAt: string }>> {
  const result = await callWorkspace({ action: 'get', code })
  if (!result.ok) return result
  if (!result.data.payload || typeof result.data.payload !== 'object') {
    return { ok: false, error: 'server' }
  }
  return {
    ok: true,
    data: {
      payload: result.data.payload as AppData,
      updatedAt: result.data.updatedAt ?? new Date().toISOString(),
    },
  }
}

export async function cloudPutWorkspace(
  code: string,
  payload: AppData,
): Promise<CloudResult<{ updatedAt: string }>> {
  const result = await callWorkspace({ action: 'put', code, payload })
  if (!result.ok) return result
  return {
    ok: true,
    data: {
      updatedAt: result.data.updatedAt ?? new Date().toISOString(),
    },
  }
}
