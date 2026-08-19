import { describe, expect, it } from 'vitest'
import {
  parseProjectsQuotesImport,
  parseSettingsMaterialsSuppliersImport,
  toProjectsQuotesTransfer,
  toSettingsMaterialsSuppliersTransfer,
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

describe('parseSettingsMaterialsSuppliersImport', () => {
  it('round-trips settings, materials and suppliers', () => {
    const payload = toSettingsMaterialsSuppliersTransfer(
      defaultCompanySettings(),
      defaultQuoteNumberState(),
      [],
      [],
    )
    const result = parseSettingsMaterialsSuppliersImport(JSON.stringify(payload))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.companySettings.quotePrefix).toBe('ORC')
    expect(result.data.quoteNumberState?.prefix).toBe('ORC')
    expect(result.data.materials).toEqual([])
    expect(result.data.suppliers).toEqual([])
  })

  it('rejects files with the wrong schema', () => {
    const result = parseSettingsMaterialsSuppliersImport(
      JSON.stringify({
        schema: 'cableflow/projects-quotes',
        version: 2,
        companySettings: defaultCompanySettings(),
        quoteNumberState: defaultQuoteNumberState(),
        materials: [],
        suppliers: [],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('invalidSchema')
  })

  it('rejects files without quote numbering state', () => {
    const result = parseSettingsMaterialsSuppliersImport(
      JSON.stringify({
        schema: 'cableflow/settings-materials-suppliers',
        version: 2,
        companySettings: defaultCompanySettings(),
        materials: [],
        suppliers: [],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('missingQuoteNumberState')
  })
})

describe('parseProjectsQuotesImport', () => {
  it('imports projects and quotes from the bundled schema', () => {
    const result = parseProjectsQuotesImport(
      JSON.stringify(toProjectsQuotesTransfer([sampleProject], [sampleQuote])),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.projects).toHaveLength(1)
    expect(result.data.projects[0]?.id).toBe('proj-1')
    expect(result.data.quotes).toHaveLength(1)
    expect(result.data.quotes[0]?.number).toBe('ORC-2026-001')
  })

  it('rejects bundled files without projects', () => {
    const result = parseProjectsQuotesImport(
      JSON.stringify({
        schema: 'cableflow/projects-quotes',
        version: 2,
        quotes: [sampleQuote],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('missingProjects')
  })

  it('rejects invalid quote records', () => {
    const result = parseProjectsQuotesImport(
      JSON.stringify({
        schema: 'cableflow/projects-quotes',
        version: 2,
        projects: [sampleProject],
        quotes: [{ id: 'q-1' }],
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('invalidQuote')
  })
})
