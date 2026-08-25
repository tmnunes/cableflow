import { useState } from 'react'
import { Check, Copy, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCloudSyncContext } from '@/hooks/CloudSyncContext'
import type { CloudSyncError } from '@/services/cloud/workspaceApi'
import { cn } from '@/utils/cn'

export function WorkspaceSyncCard() {
  const { t } = useTranslation()
  const {
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
    retrySync,
  } = useCloudSyncContext()

  const [reveal, setReveal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [enterCode, setEnterCode] = useState('')
  const [entering, setEntering] = useState(false)

  if (!configReady) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.workspace.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t('settings.workspace.checking')}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!configured) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.workspace.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('settings.workspace.notConfigured')}</p>
        </CardContent>
      </Card>
    )
  }

  const statusLabel = (() => {
    switch (status) {
      case 'syncing':
        return t('settings.workspace.statusSyncing')
      case 'synced':
        return t('settings.workspace.statusSynced')
      case 'offline':
        return t('settings.workspace.statusOffline')
      case 'error':
        return t('settings.workspace.statusError')
      case 'disabled':
        return t('settings.workspace.statusDisabled')
      default:
        return t('settings.workspace.statusIdle')
    }
  })()

  const errorLabel = (error: CloudSyncError | null) => {
    if (!error) return null
    return t(`settings.workspace.errors.${error}`)
  }

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(t('settings.workspace.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('settings.workspace.copyFailed'))
    }
  }

  const handleEnter = async () => {
    setEntering(true)
    const err = await enterWithCode(enterCode)
    setEntering(false)
    if (err) {
      toast.error(errorLabel(err) ?? t('settings.workspace.statusError'))
      return
    }
    setEnterCode('')
    toast.success(t('settings.workspace.entered'))
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{t('settings.workspace.title')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t('settings.workspace.description')}</p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            status === 'synced' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            status === 'syncing' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
            (status === 'error' || status === 'offline') &&
              'bg-destructive/10 text-destructive',
            (status === 'disabled' || status === 'idle') && 'bg-muted text-muted-foreground',
          )}
        >
          {status === 'syncing' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : status === 'disabled' || status === 'offline' ? (
            <CloudOff className="h-3.5 w-3.5" />
          ) : (
            <Cloud className="h-3.5 w-3.5" />
          )}
          {statusLabel}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={syncEnabled}
            onChange={(e) => setSyncEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          {t('settings.workspace.enableSync')}
        </label>

        {code ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t('settings.workspace.yourCode')}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block flex-1 break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
                {reveal ? code : '••••••••-••••-••••-••••-••••••••••••'}
              </code>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setReveal((v) => !v)}>
                  {reveal ? t('settings.workspace.hide') : t('settings.workspace.reveal')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {t('settings.workspace.copy')}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('settings.workspace.codeWarning')}</p>
            {lastSyncedAt ? (
              <p className="text-xs text-muted-foreground">
                {t('settings.workspace.lastSynced', {
                  date: new Date(lastSyncedAt).toLocaleString(),
                })}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('settings.workspace.noCodeYet')}</p>
        )}

        {lastError ? (
          <p className="text-sm text-destructive">{errorLabel(lastError)}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void retrySync()}>
            <RefreshCw className="h-4 w-4" />
            {t('settings.workspace.retry')}
          </Button>
          {code ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm(t('settings.workspace.disconnectConfirm'))) {
                  disconnectWorkspace()
                  toast.message(t('settings.workspace.disconnected'))
                }
              }}
            >
              {t('settings.workspace.disconnect')}
            </Button>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium">{t('settings.workspace.enterTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('settings.workspace.enterHint')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={enterCode}
              onChange={(e) => setEnterCode(e.target.value)}
              placeholder={t('settings.workspace.enterPlaceholder')}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              onClick={() => void handleEnter()}
              disabled={entering || !enterCode.trim()}
            >
              {entering ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('settings.workspace.enter')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
