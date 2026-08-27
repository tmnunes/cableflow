import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAppData } from '@/hooks/useAppData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Circuit, CircuitCategory, CircuitLoad, LoadType, ValidationStatus } from '@/types/electrical'
import { CIRCUIT_CATEGORIES } from '@/types/electrical'
import type { Material } from '@/types/material'
import { createId, cn } from '@/utils/cn'
import { calculateCircuitDesign } from '@/utils/electrical/circuitDesign'
import { loadDefaultsFromType } from '@/utils/electrical/quoteIntegration'
import { protectionLabel } from '@/utils/electrical/panel'

interface CircuitEditorProps {
  circuit: Circuit
  loadTypes: LoadType[]
  materials: Material[]
  onChange: (circuit: Circuit) => void
  onDelete: () => void
  onDuplicate: () => void
  onCreateCableRun: () => void
  locale: string
  defaultExpanded?: boolean
}

function formatNumber(value: number | undefined, locale: string, digits = 2): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value)
}

function statusClass(status: ValidationStatus): string {
  if (status === 'ok') return 'text-emerald-600'
  if (status === 'error') return 'text-destructive'
  return 'text-amber-600'
}

function statusMark(status: ValidationStatus): string {
  if (status === 'ok') return '✓'
  if (status === 'error') return '✕'
  return '⚠'
}

export function CircuitEditor({
  circuit,
  loadTypes,
  materials,
  onChange,
  onDelete,
  onDuplicate,
  onCreateCableRun,
  locale,
  defaultExpanded = true,
}: CircuitEditorProps) {
  const { t } = useTranslation()
  const { activeRuleSet } = useAppData()
  const [addLoadKey, setAddLoadKey] = useState(0)
  const [expanded, setExpanded] = useState(defaultExpanded)
  const activeLoads = loadTypes.filter((item) => item.active)
  const protectionMaterials = materials.filter(
    (item) => item.active && (item.category === 'breakers' || item.category === 'protection' || item.category === 'rcd'),
  )
  const cableMaterials = materials.filter((item) => item.active && item.category === 'cables')
  // Live design from the active rule set — do not trust a stale stored snapshot alone.
  const design = useMemo(() => {
    if (!activeRuleSet) return circuit.design
    return calculateCircuitDesign({
      circuit,
      ruleSet: activeRuleSet,
      loadTypes,
    })
  }, [activeRuleSet, circuit, loadTypes])
  const suggestedProtectionMaterialId = design?.protection?.option?.materialId
  const suggestedProtectionMaterial = suggestedProtectionMaterialId
    ? protectionMaterials.find((item) => item.id === suggestedProtectionMaterialId)
    : undefined
  const protectionSelectValue =
    circuit.selectedProtectionMaterialId === ''
      ? 'none'
      : (circuit.selectedProtectionMaterialId ?? suggestedProtectionMaterialId ?? 'none')

  const patch = (next: Partial<Circuit>) => onChange({ ...circuit, ...next })

  const updateLoad = (id: string, next: Partial<CircuitLoad>) => {
    patch({
      loads: circuit.loads.map((load) => (load.id === id ? { ...load, ...next } : load)),
    })
  }

  const addLoadFromType = (loadTypeId: string) => {
    const type = loadTypes.find((item) => item.id === loadTypeId)
    const defaults = type ? loadDefaultsFromType(type) : { description: t('electricalCircuits.customLoad'), unitPower: 0 }
    patch({
      loads: [
        ...circuit.loads,
        {
          id: createId(),
          loadTypeId: type?.id,
          quantity: 1,
          ...defaults,
        },
      ],
    })
    setAddLoadKey((value) => value + 1)
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-1 shrink-0"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? t('electricalCircuits.collapse') : t('electricalCircuits.expand')}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={circuit.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder={t('electricalCircuits.name')}
              className="text-lg font-semibold"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select value={circuit.category} onValueChange={(value) => patch({ category: value as CircuitCategory })}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIRCUIT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`electrical.categories.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={circuit.code ?? ''}
                onChange={(e) => patch({ code: e.target.value })}
                placeholder={t('electricalCircuits.code')}
                className="w-28"
              />
              {design ? (
                <Badge variant="outline" className={statusClass(design.validation.status)}>
                  {statusMark(design.validation.status)} {t(`electrical.status.${design.validation.status}`)}
                </Badge>
              ) : null}
              {!expanded ? (
                <span className="text-xs text-muted-foreground">
                  {formatNumber(design?.designCurrent, locale)} {t('electrical.amperes')}
                  {design?.protection?.option ? ` · ${protectionLabel(design.protection.option)}` : ''}
                  {design?.conductor?.recommendedSection
                    ? ` · ${formatNumber(design.conductor.recommendedSection, locale)} ${t('electrical.millimetres')}`
                    : ''}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" type="button" onClick={onDuplicate} aria-label={t('electricalCircuits.duplicate')}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="text-destructive" type="button" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {expanded ? (
        <CardContent className="space-y-5">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{t('electricalCircuits.loads')}</p>
              <Select key={addLoadKey} onValueChange={addLoadFromType}>
                <SelectTrigger className="w-auto gap-1">
                  <Plus className="h-4 w-4" />
                  <SelectValue placeholder={t('electricalCircuits.addLoad')} />
                </SelectTrigger>
                <SelectContent>
                  {activeLoads.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                      {type.isExample ? ` (${t('electrical.exampleBadge')})` : ''}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{t('electricalCircuits.customLoad')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-1 pr-2">{t('electricalCircuits.loadType')}</th>
                    <th className="py-1 pr-2 w-20">{t('electricalCircuits.quantity')}</th>
                    <th className="py-1 pr-2 w-28">{t('electricalCircuits.unitPower')}</th>
                    <th className="py-1 pr-2 w-20">{t('electricalCircuits.powerFactor')}</th>
                    <th className="py-1 pr-2 w-24">{t('electricalCircuits.utilization')}</th>
                    <th className="py-1 pr-2 w-28">{t('electricalCircuits.simultaneity')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {circuit.loads.map((load) => (
                    <tr key={load.id} className="align-top">
                      <td className="py-1 pr-2">
                        <Input
                          value={load.description ?? ''}
                          onChange={(e) => updateLoad(load.id, { description: e.target.value })}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <Input
                          type="number"
                          min={0}
                          value={load.quantity}
                          onChange={(e) => updateLoad(load.id, { quantity: Number(e.target.value) || 0 })}
                          className="font-mono"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <Input
                          type="number"
                          min={0}
                          value={load.unitPower}
                          onChange={(e) => updateLoad(load.id, { unitPower: Number(e.target.value) || 0 })}
                          className="font-mono"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step="0.01"
                          value={load.powerFactor ?? ''}
                          onChange={(e) =>
                            updateLoad(load.id, {
                              powerFactor: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          className="font-mono"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step="0.01"
                          value={load.utilizationFactor ?? ''}
                          onChange={(e) =>
                            updateLoad(load.id, {
                              utilizationFactor: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          className="font-mono"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step="0.01"
                          value={load.simultaneityFactor ?? ''}
                          onChange={(e) =>
                            updateLoad(load.id, {
                              simultaneityFactor: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          className="font-mono"
                        />
                      </td>
                      <td className="py-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => patch({ loads: circuit.loads.filter((item) => item.id !== load.id) })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">{t('electricalCircuits.length')}</span>
              <Input
                type="number"
                min={0}
                value={circuit.installation?.length ?? ''}
                onChange={(e) =>
                  patch({
                    installation: {
                      ...circuit.installation,
                      length: e.target.value === '' ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">{t('electricalCircuits.system')}</span>
              <Select
                value={circuit.installation?.systemPhase ?? 'single-phase'}
                onValueChange={(value) =>
                  patch({
                    installation: {
                      ...circuit.installation,
                      systemPhase: value as 'single-phase' | 'three-phase',
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-phase">{t('electricalCircuits.singlePhase')}</SelectItem>
                  <SelectItem value="three-phase">{t('electricalCircuits.threePhase')}</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">{t('electricalCircuits.installationMethod')}</span>
              <Select
                value={circuit.installation?.installationMethodId ?? 'unspecified'}
                onValueChange={(value) =>
                  patch({
                    installation: {
                      ...circuit.installation,
                      installationMethodId: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(activeRuleSet?.installationMethods ?? [
                    { id: 'unspecified', name: t('electricalCircuits.unspecifiedMethod') },
                  ]).map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('electricalCircuits.installationMethodHint')}{' '}
                <Link to="/electrical-rules" className="underline underline-offset-2 hover:text-foreground">
                  {t('nav.electricalRules')}
                </Link>
                .
              </p>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">{t('electricalCircuits.protectionMaterial')}</span>
              <Select
                value={protectionSelectValue}
                onValueChange={(value) =>
                  patch({ selectedProtectionMaterialId: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('quotes.fromProject.selectMaterial')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {protectionMaterials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                      {material.id === suggestedProtectionMaterialId
                        ? ` (${t('electricalCircuits.suggested')})`
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suggestedProtectionMaterial || design?.protection?.option ? (
                <p className={cn('mt-1 text-xs', suggestedProtectionMaterialId ? 'text-muted-foreground' : 'text-amber-700')}>
                  {t('electricalCircuits.protectionSuggestion', {
                    protection: design?.protection?.option
                      ? protectionLabel(design.protection.option)
                      : t('electricalCircuits.none'),
                    material: suggestedProtectionMaterial?.name ?? t('electricalCircuits.noLinkedMaterial'),
                  })}
                </p>
              ) : null}
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">{t('electricalCircuits.cableMaterial')}</span>
              <Select
                value={circuit.selectedCableMaterialId ?? 'none'}
                onValueChange={(value) =>
                  patch({ selectedCableMaterialId: value === 'none' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('quotes.fromProject.selectMaterial')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {cableMaterials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </section>

          <section className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium">{t('electricalCircuits.design')}</p>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.installedPower')}</dt>
                <dd className="font-mono">
                  {formatNumber(design?.installedPower, locale)} {t('electrical.watts')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.designPower')}</dt>
                <dd className="font-mono">
                  {formatNumber(design?.designPower, locale)} {t('electrical.watts')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.designCurrent')}</dt>
                <dd className="font-mono">
                  {formatNumber(design?.designCurrent, locale)} {t('electrical.amperes')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.recommendedSection')}</dt>
                <dd className="font-mono">
                  {design?.conductor?.recommendedSection
                    ? `${formatNumber(design.conductor.recommendedSection, locale)} ${t('electrical.millimetres')}`
                    : t('electricalCircuits.none')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.recommendedProtection')}</dt>
                <dd>
                  {design?.protection?.option
                    ? protectionLabel(design.protection.option)
                    : t('electricalCircuits.none')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.voltageDrop')}</dt>
                <dd className="font-mono">
                  {design?.conductor?.voltageDropPercent !== undefined
                    ? `${formatNumber(design.conductor.voltageDropPercent, locale)} %`
                    : t('electricalCircuits.none')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.calculated')}</dt>
                <dd>{design ? t('electricalCircuits.calculated') : t('electricalCircuits.none')}</dd>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <dt>{t('electricalCircuits.validated')}</dt>
                <dd>
                  {design?.protection?.validated
                    ? t('electricalCircuits.validated')
                    : t('electricalCircuits.notValidated')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-sm sm:col-span-2">
                <dt>{t('electricalCircuits.recommendationBasis')}</dt>
                <dd>
                  {design?.conductor
                    ? t(`electricalCircuits.basis.${design.conductor.recommendationBasis}`)
                    : t('electricalCircuits.none')}
                </dd>
              </div>
            </dl>
            {(design?.additionalProtections ?? []).some((item) => item.required) ? (
              <ul className="mt-3 space-y-1 text-sm">
                {(design?.additionalProtections ?? [])
                  .filter((item) => item.required)
                  .map((item) => (
                    <li key={`${item.type}-${item.reason ?? ''}`}>
                      {t('electricalCircuits.additionalProtections')}:{' '}
                      {protectionLabel(item.recommended ?? { type: item.type })}
                      {item.reason ? ` — ${item.reason}` : ''}
                    </li>
                  ))}
              </ul>
            ) : null}
            <ul className="mt-3 space-y-1 text-sm">
              {(design?.validation.checks ?? []).map((check) => (
                <li key={check.id} className={statusClass(check.status)}>
                  {statusMark(check.status)} {t(`electrical.codes.${check.code}`)}
                </li>
              ))}
              {(design?.warnings ?? []).map((code) => (
                <li key={code} className={statusClass('warning')}>
                  ⚠ {t(`electrical.codes.${code}`)}
                </li>
              ))}
              {(design?.errors ?? []).map((code) => (
                <li key={code} className={statusClass('error')}>
                  ✕ {t(`electrical.codes.${code}`)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{t('electrical.disclaimer')}</p>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={onCreateCableRun}>
                {t('electricalCircuits.createCableRun')}
              </Button>
            </div>
          </section>
        </CardContent>
      ) : null}
    </Card>
  )
}
