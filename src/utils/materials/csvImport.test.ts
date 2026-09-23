import { describe, expect, it } from 'vitest'
import type { Material } from '@/types'
import {
  applyMaterialsCsvImport,
  buildMaterialsCsvTemplate,
  parseCsvMoney,
  parseMaterialsCsv,
} from '@/utils/materials/csvImport'

const supplierId = 'supplier-1'

const existing: Material[] = [
  {
    id: 'mat-1',
    code: '109878',
    name: 'Old name',
    category: 'cables',
    unit: 'roll',
    metersPerRoll: 100,
    purchasePrice: 10,
    supplierId,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('parseCsvMoney', () => {
  it('parses Portuguese decimal commas', () => {
    expect(parseCsvMoney('47,68')).toBe(47.68)
  })

  it('parses thousands with comma decimal', () => {
    expect(parseCsvMoney('1.234,56')).toBe(1234.56)
  })
})

describe('parseMaterialsCsv', () => {
  it('creates and updates rows by code for the selected supplier', () => {
    const csv = [
      'code;name;purchasePrice;salePrice;unit;metersPerRoll;category',
      '109878;FIO H07V-U 1,5 PT;47,68;91,19;roll;200;cables',
      '175450;DISJ 10A;3,38;7,04;unit;;breakers',
    ].join('\n')

    const result = parseMaterialsCsv(csv, existing, supplierId)
    expect(result.delimiter).toBe(';')
    expect(result.createCount).toBe(1)
    expect(result.updateCount).toBe(1)
    expect(result.errorCount).toBe(0)

    const updated = result.rows.find((r) => r.status === 'update')
    expect(updated?.draft.purchasePrice).toBe(47.68)
    expect(updated?.draft.metersPerRoll).toBe(200)
    expect(updated?.existingId).toBe('mat-1')
  })

  it('requires metersPerRoll for roll units', () => {
    const csv = 'code,name,purchasePrice,unit\nA1,Wire,10,roll\n'
    const result = parseMaterialsCsv(csv, [], supplierId)
    expect(result.errorCount).toBe(1)
    expect(result.rows[0]?.errors).toContain('metersPerRollRequired')
  })
})

describe('applyMaterialsCsvImport', () => {
  it('updates existing and appends new materials', () => {
    const csv = [
      'code;name;purchasePrice;unit;metersPerRoll;category',
      '109878;FIO actualizado;50;roll;200;cables',
      ';Novo material;12,5;unit;;devices',
    ].join('\n')
    const parsed = parseMaterialsCsv(csv, existing, supplierId)
    const next = applyMaterialsCsvImport(existing, parsed.rows, supplierId)

    expect(next).toHaveLength(2)
    expect(next[0]?.name).toBe('FIO actualizado')
    expect(next[0]?.purchasePrice).toBe(50)
    expect(next[0]?.supplierId).toBe(supplierId)
    expect(next[1]?.name).toBe('Novo material')
    expect(next[1]?.supplierId).toBe(supplierId)
  })
})

describe('buildMaterialsCsvTemplate', () => {
  it('includes BOM and header columns', () => {
    const template = buildMaterialsCsvTemplate()
    expect(template.startsWith('\uFEFF')).toBe(true)
    expect(template).toContain('code;name;purchasePrice')
  })
})
