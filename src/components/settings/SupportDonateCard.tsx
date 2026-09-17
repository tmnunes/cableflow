import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getKofiBadgeSrc, getKofiUrl } from '@/config/donate'

export function SupportDonateCard() {
  const { t } = useTranslation()
  const kofiUrl = getKofiUrl()

  return (
    <Card className="border-border/70 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-primary" />
          {t('settings.support.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('settings.support.description')}</p>
        <a href={kofiUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
          <img
            src={getKofiBadgeSrc()}
            alt={t('settings.support.cta')}
            height={36}
            className="h-9 w-auto border-0"
          />
        </a>
        <p className="text-xs text-muted-foreground">{t('settings.support.hint')}</p>
      </CardContent>
    </Card>
  )
}
