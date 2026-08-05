import type { RefObject } from 'react'
import { Download, Eraser, Moon, Printer, Sun, Undo2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Locale, Theme } from '@/types'
import { cn } from '@/utils/cn'

interface AppHeaderProps {
  projectName: string
  onProjectNameChange: (value: string) => void
  projectNameInputRef: RefObject<HTMLInputElement | null>
  theme: Theme
  onThemeChange: (theme: Theme) => void
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  onImport: () => void
  onExport: () => void
  onPrint: () => void
  onClearAll: () => void
  canClear: boolean
  onUndo: () => void
  canUndo: boolean
}

export function AppHeader({
  projectName,
  onProjectNameChange,
  projectNameInputRef,
  theme,
  onThemeChange,
  locale,
  onLocaleChange,
  onImport,
  onExport,
  onPrint,
  onClearAll,
  canClear,
  onUndo,
  canUndo,
}: AppHeaderProps) {
  const { t } = useTranslation()
  const nameMissing = !projectName.trim()

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md print:static print:border-b print:bg-white print:backdrop-blur-none">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm print:shadow-none">
            <CableMark />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t('app.name')}
            </p>
            <label className="mt-1 block no-print">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                {t('header.projectName')}
              </span>
              <Input
                ref={projectNameInputRef}
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                aria-label={t('header.projectName')}
                aria-invalid={nameMissing}
                placeholder={t('header.projectNamePlaceholder')}
                className={cn(
                  'h-10 max-w-xl bg-background text-lg font-semibold',
                  nameMissing && 'border-destructive focus-visible:ring-destructive',
                )}
              />
              {nameMissing ? (
                <span className="mt-1 block text-[11px] text-destructive">
                  {t('validation.projectNameRequired')}
                </span>
              ) : null}
            </label>
            <p className="hidden text-lg font-semibold print:block">{projectName}</p>
            <p className="hidden text-xs text-muted-foreground print:block">
              {t('print.generated', {
                date: new Date().toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-GB'),
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <Select value={locale} onValueChange={(v) => onLocaleChange(v as Locale)}>
            <SelectTrigger className="w-[120px]" aria-label={t('header.language')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? t('header.themeLight') : t('header.themeDark')}
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? t('header.themeLight') : t('header.themeDark')}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label={t('header.undo')}
              >
                <Undo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('header.undo')}</TooltipContent>
          </Tooltip>

          <Button variant="outline" onClick={onClearAll} disabled={!canClear}>
            <Eraser />
            {t('header.clearAll')}
          </Button>
          <Button variant="outline" onClick={onImport}>
            <Upload />
            {t('header.import')}
          </Button>
          <Button variant="outline" onClick={onPrint}>
            <Printer />
            {t('header.print')}
          </Button>
          <Button onClick={onExport}>
            <Download />
            {t('header.export')}
          </Button>
        </div>
      </div>
      <p className="border-t border-border/50 px-4 py-1.5 text-center text-[11px] text-muted-foreground sm:px-6 sm:text-left no-print">
        {t('shortcuts.hint')}
      </p>
    </header>
  )
}

function CableMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4 12h4l2-4 3 8 2-4h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
