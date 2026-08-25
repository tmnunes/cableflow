import { ArrowDown, ArrowUp, ArrowUpDown, Copy, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConductorSwatch } from '@/components/project/ConductorSwatch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AutoResizeTextarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CIRCUIT_TYPES, CONDUCTOR_MAP } from '@/data/circuits'
import type { CableRun, CircuitType, ProjectTotals, SortDirection, SortField } from '@/types'
import { getSectionMm2 } from '@/utils/calculations'
import { cn, formatMeters } from '@/utils/cn'
import { formatSpecBreakdown, parseSpec } from '@/utils/parser'
import { validateCableRun } from '@/utils/validation'

interface CableRunsTableProps {
  items: CableRun[]
  search: string
  onSearchChange: (value: string) => void
  sortField: SortField
  sortDirection: SortDirection
  onToggleSort: (field: SortField) => void
  onUpdate: (id: string, patch: Partial<CableRun>) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  totalCount: number
  totals: ProjectTotals
  locale: string
}

export function CableRunsTable({
  items,
  search,
  onSearchChange,
  sortField,
  sortDirection,
  onToggleSort,
  onUpdate,
  onAdd,
  onDelete,
  onDuplicate,
  totalCount,
  totals,
  locale,
}: CableRunsTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="border-border/70 print:border print:shadow-none">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between print:p-2 print:pb-1">
        <CardTitle className="text-base print:text-sm">{t('table.title')}</CardTitle>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center no-print">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('table.search')}
              className="pl-8"
            />
          </div>
          <Button onClick={onAdd}>
            <Plus />
            {t('table.add')}
          </Button>
        </div>
      </CardHeader>

      <CableTotalsBar totals={totals} locale={locale} className="border-y border-border/70 no-print md:hidden" />

      <CardContent className="px-0 pb-2">
        <div className="space-y-3 p-3 md:hidden no-print">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {totalCount === 0 ? t('table.empty') : t('table.emptySearch')}
            </p>
          ) : (
            items.map((run) => (
              <CableRunMobileCard
                key={run.id}
                run={run}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <SortableTh
                  field="description"
                  label={t('table.description')}
                  active={sortField}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  className="min-w-[11rem]"
                />
                <SortableTh
                  field="distance"
                  label={t('table.distance')}
                  active={sortField}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  className="w-24"
                />
                <SortableTh
                  field="type"
                  label={t('table.circuit')}
                  active={sortField}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  className="min-w-[8.5rem]"
                />
                <SortableTh
                  field="section"
                  label={t('table.section')}
                  active={sortField}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  className="w-20"
                />
                <SortableTh
                  field="conduit"
                  label={t('table.conduit')}
                  active={sortField}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  className="w-20"
                />
                <SortableTh
                  field="spec"
                  label={t('table.specification')}
                  active={sortField}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  className="min-w-[7rem]"
                />
                <SortableTh
                  field="notes"
                  label={t('table.notes')}
                  active={sortField}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  className="min-w-[9rem]"
                />
                <th className="px-3 py-2 font-medium no-print w-20">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    {totalCount === 0 ? t('table.empty') : t('table.emptySearch')}
                  </td>
                </tr>
              ) : (
                items.map((run) => (
                  <CableRunRow
                    key={run.id}
                    run={run}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <CableTotalsBar totals={totals} locale={locale} className="hidden md:flex" />
    </Card>
  )
}

function CableTotalsBar({
  totals,
  locale,
  className,
}: {
  totals: ProjectTotals
  locale: string
  className?: string
}) {
  const { t } = useTranslation()

  const items = [
    {
      label: t('stats.conduitLength'),
      value: `${formatMeters(totals.totalConduitLength, locale)} ${t('stats.meters')}`,
    },
    {
      label: t('stats.cableLength'),
      value: `${formatMeters(totals.totalCableLength, locale)} ${t('stats.meters')}`,
    },
    {
      label: t('stats.conductors'),
      value: String(totals.totalConductors),
    },
    {
      label: t('stats.cableRuns'),
      value: String(totals.cableRuns),
    },
  ]

  return (
    <div
      className={cn(
        'flex flex-wrap gap-x-4 gap-y-2 border-t border-border/70 bg-muted/25 px-4 py-3 text-sm print:hidden',
        className,
      )}
    >
      <span className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-auto sm:normal-case sm:tracking-normal">
        {t('table.totals')}
      </span>
      {items.map((item) => (
        <div key={item.label} className="min-w-[7rem]">
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <p className="font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function CableRunMobileCard({
  run,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  run: CableRun
  onUpdate: (id: string, patch: Partial<CableRun>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  const { t } = useTranslation()
  const errors = validateCableRun(run, t)
  const section = getSectionMm2(run.type)
  const parsed = parseSpec(run.spec)

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-card p-3 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t('table.description')}
        </label>
        <TextField
          value={run.description}
          onChange={(description) => onUpdate(run.id, { description })}
          error={errors.description}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('table.distance')}
          </label>
          <NumberField
            value={Number.isFinite(run.distance) ? String(run.distance) : ''}
            onChange={(raw) => {
              const distance = raw === '' ? Number.NaN : Number(raw)
              onUpdate(run.id, { distance })
            }}
            error={errors.distance}
            min={0.01}
            step="0.01"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('table.conduit')}
          </label>
          <NumberField
            value={Number.isFinite(run.conduit) ? String(run.conduit) : ''}
            onChange={(raw) => {
              const conduit = raw === '' ? Number.NaN : Number(raw)
              onUpdate(run.id, { conduit })
            }}
            error={errors.conduit}
            min={1}
            step="1"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('table.circuit')}
          </label>
          <Select
            value={run.type}
            onValueChange={(value) => onUpdate(run.id, { type: value as CircuitType })}
          >
            <SelectTrigger className={cn('h-auto min-h-9 whitespace-normal', errors.type && 'border-destructive')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CIRCUIT_TYPES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {t(`circuits.${c.code}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type ? <ErrorText text={errors.type} /> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('table.section')}
          </label>
          <div className="flex min-h-9 items-center rounded-md border border-transparent bg-muted/50 px-3 font-mono text-sm tabular-nums">
            {section} {t('table.sectionUnit')}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('table.specification')}
          </label>
          <Input
            value={run.spec}
            onChange={(e) => onUpdate(run.id, { spec: e.target.value.toUpperCase() })}
            className={cn('font-mono uppercase', errors.spec && 'border-destructive focus-visible:ring-destructive')}
          />
          {errors.spec ? <ErrorText text={errors.spec} /> : null}
        </div>
      </div>

      {parsed.ok ? (
        <div className="flex flex-wrap gap-1">
          {parsed.conductors.map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1 rounded border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium"
            >
              <ConductorSwatch code={c.code} />
              {c.quantity}×{c.code}
            </span>
          ))}
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t('table.notes')}
        </label>
        <TextField value={run.notes} onChange={(notes) => onUpdate(run.id, { notes })} />
      </div>

      <div className="flex justify-end gap-1 border-t border-border/60 pt-2">
        <Button variant="ghost" size="icon" onClick={() => onDuplicate(run.id)} aria-label={t('table.duplicate')}>
          <Copy />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(run.id)}
          aria-label={t('table.delete')}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}

function SortableTh({
  field,
  label,
  active,
  direction,
  onToggle,
  className,
}: {
  field: SortField
  label: string
  active: SortField
  direction: SortDirection
  onToggle: (field: SortField) => void
  className?: string
}) {
  const isActive = active === field
  const Icon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <th className={cn('px-3 py-2 font-medium', className)}>
      <button
        type="button"
        onClick={() => onToggle(field)}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0" />
      </button>
    </th>
  )
}

function CableRunRow({
  run,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  run: CableRun
  onUpdate: (id: string, patch: Partial<CableRun>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  const { t } = useTranslation()
  const errors = validateCableRun(run, t)
  const section = getSectionMm2(run.type)
  const parsed = parseSpec(run.spec)

  return (
    <tr className="border-b border-border/70 align-top transition-colors hover:bg-muted/20 print:align-middle">
      <td className="min-w-0 px-3 py-2 print:px-1 print:py-0.5">
        <TextField
          value={run.description}
          onChange={(description) => onUpdate(run.id, { description })}
          error={errors.description}
        />
      </td>
      <td className="min-w-0 px-3 py-2 print:px-1 print:py-0.5">
        <NumberField
          value={Number.isFinite(run.distance) ? String(run.distance) : ''}
          onChange={(raw) => {
            const distance = raw === '' ? Number.NaN : Number(raw)
            onUpdate(run.id, { distance })
          }}
          error={errors.distance}
          min={0.01}
          step="0.01"
        />
      </td>
      <td className="min-w-0 px-3 py-2 print:px-1 print:py-0.5">
        <Select
          value={run.type}
          onValueChange={(value) => onUpdate(run.id, { type: value as CircuitType })}
        >
          <SelectTrigger className={cn('h-auto min-h-9 whitespace-normal [&>span]:line-clamp-none', errors.type && 'border-destructive')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CIRCUIT_TYPES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {t(`circuits.${c.code}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type ? <ErrorText text={errors.type} /> : null}
      </td>
      <td className="min-w-0 px-3 py-2 print:px-1 print:py-0.5">
        <div className="flex h-9 items-center rounded-md border border-transparent bg-muted/50 px-3 font-mono text-sm tabular-nums print:h-auto print:bg-transparent print:px-0 print:text-[9px]">
          {section} {t('table.sectionUnit')}
        </div>
      </td>
      <td className="min-w-0 px-3 py-2 print:px-1 print:py-0.5">
        <NumberField
          value={Number.isFinite(run.conduit) ? String(run.conduit) : ''}
          onChange={(raw) => {
            const conduit = raw === '' ? Number.NaN : Number(raw)
            onUpdate(run.id, { conduit })
          }}
          error={errors.conduit}
          min={1}
          step="1"
        />
      </td>
      <td className="min-w-0 px-3 py-2 print:px-1 print:py-0.5">
        <Input
          value={run.spec}
          onChange={(e) => onUpdate(run.id, { spec: e.target.value.toUpperCase() })}
          className={cn(
            'font-mono uppercase',
            errors.spec && 'border-destructive focus-visible:ring-destructive',
          )}
        />
        {parsed.ok ? (
          <div className="mt-1.5 flex flex-wrap gap-1 no-print">
            {parsed.conductors.map((c) => (
              <Tooltip key={c.code}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium">
                    <ConductorSwatch code={c.code} />
                    {c.quantity}×{c.code}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t(`conductors.${c.code}`)} · {t(`conductors.colors.${CONDUCTOR_MAP[c.code].color}`)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ) : null}
        {parsed.ok ? (
          <p className="mt-1 text-[10px] text-muted-foreground no-print">
            {formatSpecBreakdown(parsed.conductors)}
          </p>
        ) : null}
        {errors.spec ? <ErrorText text={errors.spec} /> : null}
      </td>
      <td className="min-w-0 px-3 py-2 print:px-1 print:py-0.5">
        <TextField value={run.notes} onChange={(notes) => onUpdate(run.id, { notes })} />
      </td>
      <td className="px-3 py-2 no-print">
        <RowActions onDuplicate={() => onDuplicate(run.id)} onDelete={() => onDelete(run.id)} />
      </td>
    </tr>
  )
}

function TextField({
  value,
  onChange,
  error,
  className,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
}) {
  return (
    <div className="min-w-0">
      <AutoResizeTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        minRows={1}
        className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
      />
      {error ? <ErrorText text={error} /> : null}
    </div>
  )
}

function NumberField({
  value,
  onChange,
  error,
  className,
  min,
  step,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
  min?: number
  step?: string
}) {
  return (
    <div className="min-w-0">
      <Input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('font-mono tabular-nums', error && 'border-destructive focus-visible:ring-destructive', className)}
      />
      {error ? <ErrorText text={error} /> : null}
    </div>
  )
}

function RowActions({
  onDuplicate,
  onDelete,
}: {
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onDuplicate} aria-label={t('table.duplicate')}>
            <Copy />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('table.duplicate')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={t('table.delete')}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('table.delete')}</TooltipContent>
      </Tooltip>
    </div>
  )
}

function ErrorText({ text }: { text: string }) {
  return <p className="mt-1 text-[11px] text-destructive no-print">{text}</p>
}
