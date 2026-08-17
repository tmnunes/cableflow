import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConductorSwatch } from '@/components/project/ConductorSwatch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CONDUCTOR_MAP } from '@/data/circuits'
import { useAppData } from '@/hooks/useAppData'
import {
  aggregateCableRequirements,
  buildQuoteItemsFromAggregatedMapping,
} from '@/utils/cable/quoteImport'
import { normalizeQuote } from '@/utils/quotes'
import { formatMeters } from '@/utils/cn'

export function QuoteFromProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projects, materials, createQuote, upsertQuote, companySettings, locale } = useAppData()

  const project = projects.find((p) => p.id === projectId)
  const requirements = useMemo(
    () => (project ? aggregateCableRequirements(project) : []),
    [project],
  )

  const [selections, setSelections] = useState<Record<string, string>>({})

  const cableMaterials = materials.filter((m) => m.active && m.category === 'cables')

  if (!projectId || !project) {
    return <Navigate to="/projects" replace />
  }

  const setSelection = (key: string, materialId: string) => {
    setSelections((prev) => ({ ...prev, [key]: materialId }))
  }

  const allSelected = requirements.length > 0 && requirements.every((r) => selections[r.key])

  const handleCreate = () => {
    if (!allSelected) {
      toast.error(t('quotes.fromProject.selectAll'))
      return
    }

    const quote = createQuote(projectId)
    const items = buildQuoteItemsFromAggregatedMapping(
      requirements,
      Object.entries(selections).map(([requirementKey, materialId]) => ({
        requirementKey,
        materialId,
      })),
      materials,
      companySettings.defaultMargin,
    )

    const clientName = project.projectName
    const finalized = normalizeQuote({
      ...quote,
      projectId,
      client: { ...quote.client, name: clientName },
      items,
    })

    upsertQuote(finalized)
    toast.success(t('quotes.fromProject.created'))
    navigate(`/quotes/${finalized.id}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('quotes.fromProject.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('quotes.fromProject.subtitle', { project: project.projectName })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('quotes.fromProject.aggregatedHint')}
        </p>
      </div>

      {requirements.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t('quotes.fromProject.noRequirements')}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">{t('quotes.fromProject.mapping')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requirements.map((req) => {
              const def = CONDUCTOR_MAP[req.conductorCode]
              return (
                <div
                  key={req.key}
                  className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ConductorSwatch code={req.conductorCode} size="md" />
                      <p className="font-medium">
                        {t(`conductors.${req.conductorCode}`)} · {req.sectionMm2} mm²
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`conductors.colors.${def.color}`)} ·{' '}
                      {formatMeters(req.meters, locale)} {t('stats.meters')}
                      {req.runCount > 1
                        ? ` · ${t('quotes.fromProject.runCount', { count: req.runCount })}`
                        : null}
                    </p>
                  </div>
                  <Select
                    value={selections[req.key] ?? ''}
                    onValueChange={(v) => setSelection(req.key, v)}
                  >
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue placeholder={t('quotes.fromProject.selectMaterial')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cableMaterials.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          {t('quotes.fromProject.noCableMaterials')}
                        </SelectItem>
                      ) : (
                        cableMaterials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleCreate} disabled={!allSelected}>
                {t('quotes.fromProject.create')}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/cables`)}>
                {t('quotes.fromProject.back')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
