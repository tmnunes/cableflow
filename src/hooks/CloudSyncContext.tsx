import { createContext, useContext, type ReactNode } from 'react'
import type { CloudSyncApi } from '@/hooks/useCloudSync'

const CloudSyncContext = createContext<CloudSyncApi | null>(null)

export function CloudSyncProvider({
  value,
  children,
}: {
  value: CloudSyncApi
  children: ReactNode
}) {
  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>
}

export function useCloudSyncContext(): CloudSyncApi {
  const ctx = useContext(CloudSyncContext)
  if (!ctx) throw new Error('useCloudSyncContext must be used within CloudSyncProvider')
  return ctx
}
