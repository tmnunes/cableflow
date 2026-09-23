import type { Material, MaterialCategory, MaterialUnit } from '@/types/material'
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from '@/types/material'
import { createId } from '@/utils/cn'
import { roundMoney } from '@/utils/money'

export const MATERIALS_CSV_TEMPLATE_HEADERS = [
  'code',
  'name',
  'purchasePrice',
  'salePrice',
  'unit',
  'metersPerRoll',
  'category',
  'brand',
  'notes',
] as const

export type MaterialsCsvHeader = (typeof MATERIALS_CSV_TEMPLATE_HEADERS)[number]

export type MaterialsCsvRowStatus = 'create' | 'update' | 'error'

export type MaterialsCsvRowPreview = {
  line: number
  status: MaterialsCsvRowStatus
  errors: string[]
  warnings: string[]
  existingId?: string
  draft: {
    code?: string
    name: string
    purchasePrice: number
    salePrice?: number
    unit: MaterialUnit
    metersPerRoll?: number
    category: MaterialCategory
    brand?: string
    notes?: string
  }
}

export type MaterialsCsvParseResult = {
  delimiter: ',' | ';'
  rows: MaterialsCsvRowPreview[]
  validCount: number
  createCount: number
  updateCount: number
  errorCount: number
}

const UNIT_ALIASES: Record<string, MaterialUnit> = {
  unit: 'unit',
  un: 'unit',
  unidade: 'unit',
  unidades: 'unit',
  pc: 'unit',
  pcs: 'unit',
  meter: 'meter',
  metre: 'meter',
  m: 'meter',
  metro: 'meter',
  metros: 'meter',
  roll: 'roll',
  rolo: 'roll',
  rolos: 'roll',
  box: 'box',
  cx: 'box',
  caixa: 'box',
  set: 'set',
  conjunto: 'set',
  hour: 'hour',
  hora: 'hour',
  kg: 'kg',
  other: 'other',
  outro: 'other',
}

const HEADER_ALIASES: Record<string, MaterialsCsvHeader> = {
  code: 'code',
  sku: 'code',
  ref: 'code',
  referencia: 'code',
  referência: 'code',
  name: 'name',
  nome: 'name',
  description: 'name',
  descricao: 'name',
  descrição: 'name',
  purchaseprice: 'purchasePrice',
  purchase: 'purchasePrice',
  price: 'purchasePrice',
  unitprice: 'purchasePrice',
  preco: 'purchasePrice',
  preço: 'purchasePrice',
  precocompra: 'purchasePrice',
  preçocompra: 'purchasePrice',
  valorpurchas: 'purchasePrice',
  saleprice: 'salePrice',
  sale: 'salePrice',
  precovenda: 'salePrice',
  preçovenda: 'salePrice',
  valorsell: 'salePrice',
  unit: 'unit',
  unidade: 'unit',
  metersperroll: 'metersPerRoll',
  mperroll: 'metersPerRoll',
  metrosporrolo: 'metersPerRoll',
  dimensao: 'metersPerRoll',
  dimensão: 'metersPerRoll',
  category: 'category',
  categoria: 'category',
  brand: 'brand',
  marca: 'brand',
  notes: 'notes',
  notas: 'notes',
}

/** CSV template with semicolon delimiter (Excel PT) and UTF-8 BOM. */
export function buildMaterialsCsvTemplate(): string {
  const exampleRows = [
    ['109878', 'FIO H07V-U 1,5 PT ROL', '47,68', '91,19', 'roll', '200', 'cables', '', ''],
    ['175450', 'DISJ 1P+N 10A 4.5kA C', '3,38', '7,04', 'unit', '', 'breakers', '', ''],
    ['214744', 'LIGADOR WAGO 3x4MM2 (50UN)', '18,52', '24,36', 'box', '', 'connectors', '', ''],
  ]
  const lines = [
    MATERIALS_CSV_TEMPLATE_HEADERS.join(';'),
    ...exampleRows.map((row) => row.map(escapeCsvField).join(';')),
  ]
  return `\uFEFF${lines.join('\n')}\n`
}

export function downloadMaterialsCsvTemplate(filename = 'cableflow-materials-template.csv'): void {
  const blob = new Blob([buildMaterialsCsvTemplate()], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function parseMaterialsCsv(
  raw: string,
  existing: Material[],
  supplierId: string,
): MaterialsCsvParseResult {
  const text = raw.replace(/^\uFEFF/, '').trim()
  if (!text) {
    return {
      delimiter: ';',
      rows: [],
      validCount: 0,
      createCount: 0,
      updateCount: 0,
      errorCount: 0,
    }
  }

  const delimiter = detectDelimiter(text)
  const table = parseCsvTable(text, delimiter)
  if (table.length === 0) {
    return {
      delimiter,
      rows: [],
      validCount: 0,
      createCount: 0,
      updateCount: 0,
      errorCount: 0,
    }
  }

  const headerRow = table[0]!
  const columnMap = mapHeaders(headerRow)
  if (!columnMap.name && !columnMap.code) {
    return {
      delimiter,
      rows: [
        {
          line: 1,
          status: 'error',
          errors: ['missingHeaders'],
          warnings: [],
          draft: {
            name: '',
            purchasePrice: 0,
            unit: 'unit',
            category: 'other',
          },
        },
      ],
      validCount: 0,
      createCount: 0,
      updateCount: 0,
      errorCount: 1,
    }
  }

  const rows: MaterialsCsvRowPreview[] = []
  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i]!
    if (cells.every((c) => !c.trim())) continue
    rows.push(parseDataRow(cells, columnMap, i + 1, existing, supplierId))
  }

  return {
    delimiter,
    rows,
    validCount: rows.filter((r) => r.status !== 'error').length,
    createCount: rows.filter((r) => r.status === 'create').length,
    updateCount: rows.filter((r) => r.status === 'update').length,
    errorCount: rows.filter((r) => r.status === 'error').length,
  }
}

export function applyMaterialsCsvImport(
  existing: Material[],
  rows: MaterialsCsvRowPreview[],
  supplierId: string,
): Material[] {
  const now = new Date().toISOString()
  const next = [...existing]

  for (const row of rows) {
    if (row.status === 'error') continue
    const draft = row.draft

    if (row.status === 'update' && row.existingId) {
      const index = next.findIndex((m) => m.id === row.existingId)
      if (index < 0) continue
      const current = next[index]!
      next[index] = {
        ...current,
        code: draft.code || current.code,
        name: draft.name,
        purchasePrice: draft.purchasePrice,
        salePrice: draft.salePrice !== undefined ? draft.salePrice : current.salePrice,
        unit: draft.unit,
        metersPerRoll:
          draft.unit === 'roll' ? draft.metersPerRoll : undefined,
        category: draft.category,
        brand: draft.brand ?? current.brand,
        notes: draft.notes ?? current.notes,
        supplierId,
        active: true,
        updatedAt: now,
      }
      continue
    }

    next.push({
      id: createId(),
      code: draft.code,
      name: draft.name,
      category: draft.category,
      unit: draft.unit,
      metersPerRoll: draft.unit === 'roll' ? draft.metersPerRoll : undefined,
      brand: draft.brand,
      notes: draft.notes,
      purchasePrice: draft.purchasePrice,
      salePrice: draft.salePrice,
      supplierId,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
  }

  return next
}

function parseDataRow(
  cells: string[],
  columnMap: Partial<Record<MaterialsCsvHeader, number>>,
  line: number,
  existing: Material[],
  supplierId: string,
): MaterialsCsvRowPreview {
  const errors: string[] = []
  const warnings: string[] = []

  const code = getCell(cells, columnMap.code)?.trim() || undefined
  const name = getCell(cells, columnMap.name)?.trim() ?? ''
  const purchaseRaw = getCell(cells, columnMap.purchasePrice) ?? ''
  const saleRaw = getCell(cells, columnMap.salePrice) ?? ''
  const unitRaw = getCell(cells, columnMap.unit) ?? ''
  const metersRaw = getCell(cells, columnMap.metersPerRoll) ?? ''
  const categoryRaw = getCell(cells, columnMap.category) ?? ''
  const brand = getCell(cells, columnMap.brand)?.trim() || undefined
  const notes = getCell(cells, columnMap.notes)?.trim() || undefined

  if (!name) errors.push('nameRequired')

  const purchasePrice = parseCsvMoney(purchaseRaw)
  if (purchasePrice === null) errors.push('purchasePriceInvalid')

  let salePrice: number | undefined
  if (saleRaw.trim()) {
    const parsedSale = parseCsvMoney(saleRaw)
    if (parsedSale === null) errors.push('salePriceInvalid')
    else salePrice = parsedSale
  }

  const unitResult = normalizeUnit(unitRaw)
  if (unitRaw.trim() && !unitResult.ok) {
    errors.push('unitInvalid')
  } else if (unitResult.warning) {
    warnings.push(unitResult.warning)
  }
  const unit = unitResult.value

  const categoryResult = normalizeCategory(categoryRaw)
  if (categoryRaw.trim() && !categoryResult.ok) {
    warnings.push('categoryFallback')
  }
  const category = categoryResult.value

  let metersPerRoll: number | undefined
  if (metersRaw.trim()) {
    const meters = parseCsvMoney(metersRaw)
    if (meters === null || meters <= 0) errors.push('metersPerRollInvalid')
    else metersPerRoll = meters
  }

  if (unit === 'roll' && (metersPerRoll === undefined || metersPerRoll <= 0)) {
    errors.push('metersPerRollRequired')
  }

  const existingMatch = code
    ? existing.find(
        (m) =>
          m.supplierId === supplierId &&
          (m.code ?? '').trim().toLowerCase() === code.toLowerCase(),
      )
    : undefined

  if (errors.length > 0) {
    return {
      line,
      status: 'error',
      errors,
      warnings,
      existingId: existingMatch?.id,
      draft: {
        code,
        name,
        purchasePrice: purchasePrice ?? 0,
        salePrice,
        unit,
        metersPerRoll,
        category,
        brand,
        notes,
      },
    }
  }

  return {
    line,
    status: existingMatch ? 'update' : 'create',
    errors: [],
    warnings,
    existingId: existingMatch?.id,
    draft: {
      code,
      name,
      purchasePrice: purchasePrice!,
      salePrice,
      unit,
      metersPerRoll,
      category,
      brand,
      notes,
    },
  }
}

export function parseCsvMoney(raw: string): number | null {
  let s = raw.trim().replace(/\s/g, '').replace(/€/g, '')
  if (!s) return null

  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }

  const value = Number.parseFloat(s)
  if (!Number.isFinite(value) || value < 0) return null
  return roundMoney(value)
}

function normalizeUnit(raw: string): {
  ok: boolean
  value: MaterialUnit
  warning?: string
} {
  const key = raw.trim().toLowerCase()
  if (!key) return { ok: true, value: 'unit' }
  const mapped = UNIT_ALIASES[key]
  if (mapped) return { ok: true, value: mapped }
  if ((MATERIAL_UNITS as readonly string[]).includes(key)) {
    return { ok: true, value: key as MaterialUnit }
  }
  return { ok: false, value: 'unit', warning: 'unitFallback' }
}

function normalizeCategory(raw: string): { ok: boolean; value: MaterialCategory } {
  const key = raw.trim().toLowerCase()
  if (!key) return { ok: true, value: 'other' }
  if ((MATERIAL_CATEGORIES as readonly string[]).includes(key)) {
    return { ok: true, value: key as MaterialCategory }
  }
  return { ok: false, value: 'other' }
}

function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  const semicolons = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semicolons >= commas ? ';' : ','
}

function mapHeaders(headerRow: string[]): Partial<Record<MaterialsCsvHeader, number>> {
  const map: Partial<Record<MaterialsCsvHeader, number>> = {}
  headerRow.forEach((raw, index) => {
    const key = normalizeHeaderKey(raw)
    const field = HEADER_ALIASES[key]
    if (field && map[field] === undefined) map[field] = index
  })
  return map
}

function normalizeHeaderKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function getCell(cells: string[], index: number | undefined): string | undefined {
  if (index === undefined) return undefined
  return cells[index]
}

function parseCsvTable(text: string, delimiter: ',' | ';'): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
        continue
      }
      if (char === '"') {
        inQuotes = false
        continue
      }
      field += char
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }
    if (char === delimiter) {
      row.push(field)
      field = ''
      continue
    }
    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }
    if (char === '\r') continue
    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function escapeCsvField(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
