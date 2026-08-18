import { describe, expect, it } from 'vitest'
import {
  parseProjectsImport,
  parseQuotesImport,
  parseSettingsImport,
  toProjectsExport,
  toQuotesExport,
  toSettingsExport,
} from '@/services/importExport'
import { defaultCompanySettings, defaultQuoteNumberState } from '@/types/company'
import type { Quote } from '@/types/quote'
import type { ProjectRecord } from '@/types/cable'

const sampleProject: ProjectRecord = {
  id: 'proj-1',
  projectName: 'House A',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  items: [
    {
      id: 'run-1',
      description: 'Kitchen',
      distance: 12,
      type: 'I',
      conduit: 3,
      spec: 'FTN',
      notes: '',
    },
  ],
  materials: [],
}

const sampleQuote: Quote = {
  id: 'quote-1',
  number: 'ORC-2026-001',
  client: { name: 'Acme' },
  date: '2026-08-18',
  status: 'draft',
  items: [],
  labor: [],
  taxRate: 23,
  createdAt: '2026-08-18T00:00:00.000Z',
  updatedAt: '2026-08-18T00:00:00.000Z',
}

describe('parseSettingsImport', () => {
  it('round-trips company settings', () => {
    const payload = toSettingsExport(defaultCompanySettings(), defaultQuoteNumberState())
    const result = parseSettingsImport(JSON.stringify(payload))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.companySettings.quotePrefix).toBe('ORC')
    expect(result.data.quoteNumberState?.prefix).toBe('ORC')
  })

  it('accepts a bare company settings object', () => {
    const result = parseSettingsImport(
      JSON.stringify({
        name: 'Flow Ltd',
        defaultTaxRate: 13,
        defaultMargin: 20,
        quotePrefix: 'CF',
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.companySettings.name).toBe('Flow Ltd')
    expect(result.data.companySettings.quotePrefix).toBe('CF')
  })

  it('rejects files without settings', () => {
    const result = parseSettingsImport(JSON.stringify({ materials: [] }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('missingSettings')
  })
})

describe('parseQuotesImport', () => {
  it('imports a quotes collection', () => {
    const result = parseQuotesImport(JSON.stringify(toQuotesExport([sampleQuote])))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0]?.number).toBe('ORC-2026-001')
  })

  it('imports a single quote file', () => {
    const result = parseQuotesImport(JSON.stringify({ version: 2, quote: sampleQuote }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data[0]?.id).toBe('quote-1')
  })
})

describe('parseProjectsImport', () => {
  it('imports a single project export', () => {
    const result = parseProjectsImport(
      JSON.stringify({
        projectName: 'House A',
        version: 1,
        items: sampleProject.items,
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.kind).toBe('single')
    if (result.kind !== 'single') return
    expect(result.project.projectName).toBe('House A')
  })

  it('imports a projects collection and keeps ids', () => {
    const result = parseProjectsImport(JSON.stringify(toProjectsExport([sampleProject])))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.kind).toBe('collection')
    if (result.kind !== 'collection') return
    expect(result.projects[0]?.id).toBe('proj-1')
    expect(result.projects[0]?.projectName).toBe('House A')
  })
})
