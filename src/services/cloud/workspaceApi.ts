import type { AppData } from '@/types/app'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

export function getSupabaseUrl(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return url?.trim() ? url.replace(/\/$/, '') : null
}

export function getSupabaseAnonKey(): string | null {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return key?.trim() ? key : null
}

export function isCloudConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

export type CloudSyncError =
  | 'not_configured'
  | 'network'
  | 'invalid_code'
  | 'not_found'
  | 'already_exists'
  | 'server'

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

async function callWorkspace(
  body: Record<string, unknown>,
): Promise<CloudResult<WorkspaceResponse>> {
  const base = getSupabaseUrl()
  const anon = getSupabaseAnonKey()
  if (!base || !anon) {
    return { ok: false, error: 'not_configured' }
  }

  try {
    const res = await fetch(`${base}/functions/v1/cableflow-workspace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anon}`,
        apikey: anon,
      },
      body: JSON.stringify(body),
    })

    let json: WorkspaceResponse = {}
    try {
      json = (await res.json()) as WorkspaceResponse
    } catch {
      // ignore
    }

    if (res.status === 404 || json.error === 'not_found') {
      return { ok: false, error: 'not_found' }
    }
    if (res.status === 409 || json.error === 'already_exists') {
      return { ok: false, error: 'already_exists' }
    }
    if (res.status === 400 && json.error === 'invalid_code') {
      return { ok: false, error: 'invalid_code' }
    }
    if (!res.ok) {
      return { ok: false, error: 'server' }
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
