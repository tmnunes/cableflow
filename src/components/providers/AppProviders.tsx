import type { ReactNode } from 'react'
import { AppDataProvider, useAppData } from '@/hooks/useAppData'
import { CloudSyncProvider } from '@/hooks/CloudSyncContext'
import { useCloudSync } from '@/hooks/useCloudSync'

function CloudSyncBridge({ children }: { children: ReactNode }) {
  const { data, replaceAppData } = useAppData()
  const cloud = useCloudSync({ data, replaceAppData })
  return <CloudSyncProvider value={cloud}>{children}</CloudSyncProvider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppDataProvider>
      <CloudSyncBridge>{children}</CloudSyncBridge>
    </AppDataProvider>
  )
}
