import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppData } from '@/hooks/useAppData'
import { createId } from '@/utils/cn'
import type { CircuitRule, ElectricalRuleSet } from '@/types/electrical'
import { CIRCUIT_CATEGORIES } from '@/types/electrical'

function parseNumberList(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value) && value > 0)
}

export function ElectricalRulesPage() {
  const { t } = useTranslation()
  const { activeRuleSet, upsertElectricalRuleSet } = useAppData()
  const [draft, setDraft] = useState<ElectricalRuleSet | undefined>(activeRuleSet)

  useEffect(() => {
    setDraft(activeRuleSet)
  }, [activeRuleSet])

  if (!activeRuleSet || !draft) {
    return <p className="text-sm text-muted-foreground">{t('electricalRules.title')}</p>
  }

  const patch = (next: Partial<ElectricalRuleSet>) => {
    setDraft({
      ...draft,
      ...next,
      defaults: { ...draft.defaults, ...(next.defaults ?? {}) },
    })
  }

  const save = () => {
    upsertElectricalRuleSet({
      ...draft,
      updatedAt: new Date().toISOString(),
    })
    toast.success(t('electricalRules.saved'))
  }

  const reference = draft.references?.[0]
  const conductorRule = draft.conductorRules[0]
  const ampacityRows = conductorRule?.ampacityBySection ?? []

  const updateCircuitRule = (category: (typeof CIRCUIT_CATEGORIES)[number], next: Partial<CircuitRule>) => {
    const existing = draft.circuitRules.find((item) => item.circuitCategory === category)
    const circuitRules = existing
      ? draft.circuitRules.map((item) =>
          item.circuitCategory === category ? { ...item, ...next } : item,
        )
      : [
          ...draft.circuitRules,
          {
            id: createId(),
            circuitCategory: category,
            allowedConductorSections: [],
            protectionOptionIds: [],
            calculationMethod: 'sumLoads' as const,
            ...next,
          },
        ]
    patch({ circuitRules })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('electricalRules.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('electricalRules.subtitle')}</p>
        </div>
        <Button onClick={save}>{t('electricalRules.save')}</Button>
      </div>

      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
        {t('electrical.disclaimer')}
      </p>

      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{draft.name}</CardTitle>
          {draft.isExample ? <Badge variant="outline">{t('electrical.exampleBadge')}</Badge> : null}
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.name')}</span>
            <Input value={draft.name} onChange={(e) => patch({ name: e.target.value, isExample: false })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.version')}</span>
            <Input value={draft.version} onChange={(e) => patch({ version: e.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.voltage')}</span>
            <Input
              type="number"
              value={draft.voltage}
              onChange={(e) =>
                patch({
                  voltage: Number(e.target.value) || 0,
                  defaults: { ...draft.defaults, voltage: Number(e.target.value) || 0 },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.frequency')}</span>
            <Input
              type="number"
              value={draft.frequency ?? ''}
              onChange={(e) => patch({ frequency: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.maxVoltageDrop')}</span>
            <Input
              type="number"
              value={draft.defaults.maxVoltageDropPercent ?? ''}
              onChange={(e) =>
                patch({
                  defaults: {
                    ...draft.defaults,
                    maxVoltageDropPercent: e.target.value === '' ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.sections')}</span>
            <Input
              value={draft.defaults.availableSectionsMm2.join(', ')}
              onChange={(e) =>
                patch({
                  defaults: {
                    ...draft.defaults,
                    availableSectionsMm2: parseNumberList(e.target.value),
                  },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.resistivity')}</span>
            <Input
              type="number"
              step="0.0001"
              value={draft.defaults.conductorResistivityOhmMm2PerM ?? ''}
              onChange={(e) =>
                patch({
                  defaults: {
                    ...draft.defaults,
                    conductorResistivityOhmMm2PerM: e.target.value === '' ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.reactance')}</span>
            <Input
              type="number"
              step="0.01"
              value={draft.defaults.conductorReactanceOhmPerKm ?? ''}
              onChange={(e) =>
                patch({
                  defaults: {
                    ...draft.defaults,
                    conductorReactanceOhmPerKm: e.target.value === '' ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </label>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('electricalRules.reference')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.referenceSource')}</span>
            <Input
              value={reference?.source ?? ''}
              onChange={(e) =>
                patch({
                  references: [{ ...reference, source: e.target.value || undefined }],
                })
              }
              placeholder={t('electrical.sourceNotConfigured')}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.referenceDocument')}</span>
            <Input
              value={reference?.document ?? ''}
              onChange={(e) =>
                patch({
                  references: [{ ...reference, document: e.target.value || undefined }],
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.referenceSection')}</span>
            <Input
              value={reference?.section ?? ''}
              onChange={(e) =>
                patch({
                  references: [{ ...reference, section: e.target.value || undefined }],
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('electricalRules.referenceVersion')}</span>
            <Input
              value={reference?.version ?? ''}
              onChange={(e) =>
                patch({
                  references: [{ ...reference, version: e.target.value || undefined }],
                })
              }
            />
          </label>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{t('electricalRules.installationMethods')}</CardTitle>
            <p className="mt-1 text-sm font-normal text-muted-foreground">
              {t('electricalRules.installationMethodsHint')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              patch({
                installationMethods: [
                  ...draft.installationMethods,
                  {
                    id: createId(),
                    name: t('electricalRules.newInstallationMethod'),
                    notes: '',
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" />
            {t('electricalRules.addInstallationMethod')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.installationMethods.map((method, index) => (
            <div key={method.id} className="grid gap-3 rounded-md border border-border/70 p-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">{t('electricalRules.methodName')}</span>
                <Input
                  value={method.name}
                  onChange={(e) => {
                    const installationMethods = draft.installationMethods.map((item, i) =>
                      i === index ? { ...item, name: e.target.value } : item,
                    )
                    patch({ installationMethods })
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">{t('electricalRules.methodNotes')}</span>
                <Input
                  value={method.notes ?? ''}
                  onChange={(e) => {
                    const installationMethods = draft.installationMethods.map((item, i) =>
                      i === index ? { ...item, notes: e.target.value } : item,
                    )
                    patch({ installationMethods })
                  }}
                />
              </label>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={draft.installationMethods.length <= 1}
                  onClick={() =>
                    patch({
                      installationMethods: draft.installationMethods.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{t('electricalRules.ampacity')}</CardTitle>
            <p className="mt-1 text-sm font-normal text-muted-foreground">{t('electricalRules.ampacityHint')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rule = conductorRule ?? {
                id: createId(),
                conductorMaterial: 'copper' as const,
                installationMethodId: 'unspecified',
                ampacityBySection: [],
              }
              patch({
                conductorRules: [
                  {
                    ...rule,
                    ampacityBySection: [...(rule.ampacityBySection ?? []), { sectionMm2: 0, currentA: 0 }],
                  },
                ],
              })
            }}
          >
            <Plus className="h-4 w-4" />
            {t('electricalRules.addAmpacityRow')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto px-0">
          <div className="px-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">{t('electricalRules.ampacityMethod')}</span>
              <select
                className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={conductorRule?.installationMethodId ?? 'unspecified'}
                onChange={(e) => {
                  const rule = conductorRule ?? {
                    id: createId(),
                    conductorMaterial: 'copper' as const,
                    installationMethodId: 'unspecified',
                    ampacityBySection: [],
                  }
                  patch({
                    conductorRules: [
                      {
                        ...rule,
                        installationMethodId: e.target.value,
                      },
                    ],
                  })
                }}
              >
                {draft.installationMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {ampacityRows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-amber-700">{t('electrical.codes.ampacityNotConfigured')}</p>
          ) : (
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">{t('electricalRules.sectionMm2')}</th>
                  <th className="px-3 py-2">{t('electricalRules.currentA')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ampacityRows.map((row, index) => (
                  <tr key={`${row.sectionMm2}-${index}`} className="border-b border-border/70">
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={row.sectionMm2 || ''}
                        onChange={(e) => {
                          const ampacityBySection = ampacityRows.map((item, i) =>
                            i === index ? { ...item, sectionMm2: Number(e.target.value) || 0 } : item,
                          )
                          patch({
                            conductorRules: [
                              {
                                ...(conductorRule ?? {
                                  id: createId(),
                                  conductorMaterial: 'copper' as const,
                                  installationMethodId: 'unspecified',
                                  ampacityBySection: [],
                                }),
                                ampacityBySection,
                              },
                            ],
                          })
                        }}
                        className="w-28 font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={row.currentA || ''}
                        onChange={(e) => {
                          const ampacityBySection = ampacityRows.map((item, i) =>
                            i === index ? { ...item, currentA: Number(e.target.value) || 0 } : item,
                          )
                          patch({
                            conductorRules: [
                              {
                                ...(conductorRule ?? {
                                  id: createId(),
                                  conductorMaterial: 'copper' as const,
                                  installationMethodId: 'unspecified',
                                  ampacityBySection: [],
                                }),
                                ampacityBySection,
                              },
                            ],
                          })
                        }}
                        className="w-28 font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const ampacityBySection = ampacityRows.filter((_, i) => i !== index)
                          patch({
                            conductorRules: [
                              {
                                ...(conductorRule ?? {
                                  id: createId(),
                                  conductorMaterial: 'copper' as const,
                                  installationMethodId: 'unspecified',
                                  ampacityBySection: [],
                                }),
                                ampacityBySection,
                              },
                            ],
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('electricalRules.protections')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-3 py-2">{t('electricalRules.type')}</th>
                <th className="px-3 py-2">{t('electricalRules.rating')}</th>
                <th className="px-3 py-2">{t('electricalRules.poles')}</th>
                <th className="px-3 py-2">{t('electricalRules.curve')}</th>
                <th className="px-3 py-2">{t('electricalRules.enabled')}</th>
              </tr>
            </thead>
            <tbody>
              {draft.protectionOptions.map((option, index) => (
                <tr key={option.id} className="border-b border-border/70">
                  <td className="px-3 py-2">{option.type}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={option.rating}
                      onChange={(e) => {
                        const protectionOptions = draft.protectionOptions.map((item, i) =>
                          i === index ? { ...item, rating: Number(e.target.value) || 0 } : item,
                        )
                        patch({ protectionOptions })
                      }}
                      className="w-24 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">{option.poles ?? '—'}</td>
                  <td className="px-3 py-2">{option.curve ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Button
                      variant={option.enabled ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const protectionOptions = draft.protectionOptions.map((item, i) =>
                          i === index ? { ...item, enabled: !item.enabled } : item,
                        )
                        patch({ protectionOptions })
                      }}
                    >
                      {option.enabled ? t('electricalRules.enabled') : '—'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{t('electricalRules.circuitRules')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CIRCUIT_CATEGORIES.map((category) => {
            const rule = draft.circuitRules.find((item) => item.circuitCategory === category)
            return (
              <div key={category} className="grid gap-3 rounded-md border border-border/70 p-3 sm:grid-cols-3">
                <p className="font-medium sm:col-span-3">{t(`electrical.categories.${category}`)}</p>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">{t('electricalRules.defaultSection')}</span>
                  <Input
                    type="number"
                    min={0}
                    value={rule?.defaultConductorSection ?? ''}
                    onChange={(e) =>
                      updateCircuitRule(category, {
                        defaultConductorSection: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="font-mono"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted-foreground">{t('electricalRules.allowedSections')}</span>
                  <Input
                    value={(rule?.allowedConductorSections ?? []).join(', ')}
                    onChange={(e) =>
                      updateCircuitRule(category, {
                        allowedConductorSections: parseNumberList(e.target.value),
                      })
                    }
                    className="font-mono"
                  />
                </label>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
