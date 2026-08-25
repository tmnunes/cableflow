import { readJson, writeJson, removeKey } from '@/services/storage/baseStorage'
import {
  WORKSPACE_CODE_KEY,
  WORKSPACE_META_KEY,
  WORKSPACE_SYNC_ENABLED_KEY,
} from '@/services/storage/workspaceKeys'

export interface WorkspaceMeta {
  code: string
  remoteUpdatedAt?: string
  lastSyncedAt?: string
}

export function loadWorkspaceCode(): string | null {
  const code = readJson<string>(WORKSPACE_CODE_KEY)
  return typeof code === 'string' && code.trim() ? code.trim() : null
}

export function saveWorkspaceCode(code: string): void {
  writeJson(WORKSPACE_CODE_KEY, code.trim())
}

export function clearWorkspaceCode(): void {
  removeKey(WORKSPACE_CODE_KEY)
  removeKey(WORKSPACE_META_KEY)
}

export function loadWorkspaceMeta(): WorkspaceMeta | null {
  return readJson<WorkspaceMeta>(WORKSPACE_META_KEY)
}

export function saveWorkspaceMeta(meta: WorkspaceMeta): void {
  writeJson(WORKSPACE_META_KEY, meta)
}

/** Sync is enabled by default when cloud is configured */
export function loadWorkspaceSyncEnabled(): boolean {
  const stored = readJson<boolean>(WORKSPACE_SYNC_ENABLED_KEY)
  if (typeof stored === 'boolean') return stored
  return true
}

export function saveWorkspaceSyncEnabled(enabled: boolean): void {
  writeJson(WORKSPACE_SYNC_ENABLED_KEY, enabled)
}
