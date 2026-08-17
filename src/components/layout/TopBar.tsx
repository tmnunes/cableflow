import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useAppData } from '@/hooks/useAppData'
import { Button } from '@/components/ui/button'
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
import type { Locale } from '@/types'
import { cn } from '@/utils/cn'

interface TopBarProps {
  className?: string
}

export function TopBar({ className }: TopBarProps) {
  const { t, i18n } = useTranslation()
  const { theme, setTheme, locale, setLocale } = useAppData()

  useEffect(() => {
    void i18n.changeLanguage(locale)
  }, [locale, i18n])

  return (
    <div
      className={cn(
        'hidden items-center justify-end gap-2 border-b border-border/50 px-4 py-2 lg:flex no-print',
        className,
      )}
    >
      <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger className="h-8 w-[120px]" aria-label={t('header.language')}>
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
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? t('header.themeLight') : t('header.themeDark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {theme === 'dark' ? t('header.themeLight') : t('header.themeDark')}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
