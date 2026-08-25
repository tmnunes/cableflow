import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData } from '@/types/app'
import {
  cloudCreateWorkspace,
  cloudGetWorkspace,
  cloudPutWorkspace,
  createWorkspaceCode,
  isCloudConfigured,
  isValidWorkspaceCode,
  probeCloudConfigured,
  resetCloudConfiguredCache,
  type CloudSyncError,
} from '@/services/cloud/workspaceApi'
import {
  clearWorkspaceCode,
  loadWorkspaceCode,
  loadWorkspaceMeta,
  loadWorkspaceSyncEnabled,
  saveWorkspaceCode,
  saveWorkspaceMeta,
  saveWorkspaceSyncEnabled,
} from '@/services/storage/workspaceStorage'

export type CloudSyncStatus =
  | 'idle'
  | 'disabled'
  | 'offline'
  | 'syncing'
  | 'synced'
  | 'error'

interface UseCloudSyncOptions {
  data: AppData
  replaceAppData: (data: AppData) => void
}

export function useCloudSync({ data, replaceAppData }: UseCloudSyncOptions) {
  const [configured, setConfigured] = useState(false)
  const [configReady, setConfigReady] = useState(false)
  const [code, setCode] = useState<string | null>(() => loadWorkspaceCode())
  const [syncEnabled, setSyncEnabledState] = useState(() => loadWorkspaceSyncEnabled())
  const [status, setStatus] = useState<CloudSyncStatus>('disabled')
  const [lastError, setLastError] = useState<CloudSyncError | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => loadWorkspaceMeta()?.lastSyncedAt ?? null,
  )

  const bootstrapped = useRef(false)
  const skipNextPush = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    let cancelled = false
    const runProbe = () =>
      probeCloudConfigured().then((ok) => {
        if (cancelled) return
        setConfigured(ok)
        setConfigReady(true)
        setStatus(ok && loadWorkspaceSyncEnabled() ? 'idle' : 'disabled')
      })
    void runProbe()
    return () => {
      cancelled = true
    }
  }, [])

  const retryConfigProbe = useCallback(async () => {
    setConfigReady(false)
    resetCloudConfiguredCache()
    const ok = await probeCloudConfigured(true)
    setConfigured(ok)
    setConfigReady(true)
    setStatus(ok && syncEnabled ? 'idle' : 'disabled')
    if (ok) bootstrapped.current = false
    return ok
  }, [syncEnabled])

  const setSyncEnabled = useCallback((enabled: boolean) => {
    saveWorkspaceSyncEnabled(enabled)
    setSyncEnabledState(enabled)
    setStatus(enabled && isCloudConfigured() ? 'idle' : 'disabled')
    if (enabled) {
      bootstrapped.current = false
    }
  }, [])

  const markSynced = useCallback((workspaceCode: string, remoteUpdatedAt: string) => {
    const now = new Date().toISOString()
    saveWorkspaceCode(workspaceCode)
    saveWorkspaceMeta({
      code: workspaceCode,
      remoteUpdatedAt,
      lastSyncedAt: now,
    })
    setCode(workspaceCode)
    setLastSyncedAt(now)
    setLastError(null)
    setStatus('synced')
  }, [])

  /** Create workspace on first visit, or pull remote (silent LWW on open) */
  useEffect(() => {
    if (!configured || !syncEnabled) {
      if (!syncEnabled) setStatus('disabled')
      return
    }
    if (bootstrapped.current) return
    bootstrapped.current = true

    let cancelled = false

    const bootstrap = async () => {
      setStatus('syncing')
      const existing = loadWorkspaceCode()

      if (existing) {
        const remote = await cloudGetWorkspace(existing)
        if (cancelled) return

        if (remote.ok) {
          skipNextPush.current = true
          replaceAppData(remote.data.payload)
          markSynced(existing, remote.data.updatedAt)
          return
        }

        if (remote.error === 'not_found') {
          const created = await cloudCreateWorkspace(existing, dataRef.current)
          if (cancelled) return
          if (created.ok) {
            markSynced(existing, created.data.updatedAt)
            return
          }
          setLastError(created.error)
          setStatus(created.error === 'network' ? 'offline' : 'error')
          return
        }

        setLastError(remote.error)
        setStatus(remote.error === 'network' ? 'offline' : 'error')
        return
      }

      const newCode = createWorkspaceCode()
      const created = await cloudCreateWorkspace(newCode, dataRef.current)
      if (cancelled) return

      if (created.ok) {
        markSynced(created.data.code, created.data.updatedAt)
        return
      }

      if (created.error === 'already_exists') {
        const retryCode = createWorkspaceCode()
        const retry = await cloudCreateWorkspace(retryCode, dataRef.current)
        if (cancelled) return
        if (retry.ok) {
          markSynced(retry.data.code, retry.data.updatedAt)
          return
        }
        setLastError(retry.error)
        setStatus(retry.error === 'network' ? 'offline' : 'error')
        return
      }

      setLastError(created.error)
      setStatus(created.error === 'network' ? 'offline' : 'error')
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [configured, syncEnabled, markSynced, replaceAppData])

  /** Continuous push (debounced) — last-write-wins */
  useEffect(() => {
    if (!configured || !syncEnabled || !code) return
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }

    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      setStatus('syncing')
      void cloudPutWorkspace(code, data).then((result) => {
        if (result.ok) {
          markSynced(code, result.data.updatedAt)
        } else {
          setLastError(result.error)
          setStatus(result.error === 'network' ? 'offline' : 'error')
        }
      })
    }, 2000)

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [data, code, configured, syncEnabled, markSynced])

  const enterWithCode = useCallback(
    async (rawCode: string): Promise<CloudSyncError | null> => {
      const trimmed = rawCode.trim()
      if (!isValidWorkspaceCode(trimmed)) return 'invalid_code'
      if (!configured) return 'not_configured'

      setStatus('syncing')
      const remote = await cloudGetWorkspace(trimmed)
      if (!remote.ok) {
        setLastError(remote.error)
        setStatus(remote.error === 'network' ? 'offline' : 'error')
        return remote.error
      }

      skipNextPush.current = true
      replaceAppData(remote.data.payload)
      saveWorkspaceSyncEnabled(true)
      setSyncEnabledState(true)
      markSynced(trimmed, remote.data.updatedAt)
      return null
    },
    [configured, markSynced, replaceAppData],
  )

  const disconnectWorkspace = useCallback(() => {
    clearWorkspaceCode()
    setCode(null)
    setLastSyncedAt(null)
    setLastError(null)
    setStatus(configured && syncEnabled ? 'idle' : 'disabled')
  }, [configured, syncEnabled])

  const retrySync = useCallback(async () => {
    if (!configured || !syncEnabled) return
    setStatus('syncing')

    let workspaceCode = code
    if (!workspaceCode) {
      workspaceCode = createWorkspaceCode()
      const created = await cloudCreateWorkspace(workspaceCode, dataRef.current)
      if (!created.ok) {
        setLastError(created.error)
        setStatus(created.error === 'network' ? 'offline' : 'error')
        return
      }
      markSynced(created.data.code, created.data.updatedAt)
      return
    }

    const result = await cloudPutWorkspace(workspaceCode, dataRef.current)
    if (result.ok) {
      markSynced(workspaceCode, result.data.updatedAt)
    } else {
      setLastError(result.error)
      setStatus(result.error === 'network' ? 'offline' : 'error')
    }
  }, [code, configured, syncEnabled, markSynced])

  return {
    configured,
    configReady,
    code,
    syncEnabled,
    setSyncEnabled,
    status,
    lastError,
    lastSyncedAt,
    enterWithCode,
    disconnectWorkspace,
    retryConfigProbe,
    retrySync,
  }
}

export type CloudSyncApi = ReturnType<typeof useCloudSync>
