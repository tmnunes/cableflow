import type { AppData } from '@/types/app'
import { DATA_VERSION } from '@/types/app'
import type { ProjectRecord } from '@/types/cable'
import {
  defaultCompanySettings,
  defaultQuoteNumberState,
} from '@/types/company'
import { PROJECT_VERSION } from '@/services/storage/keys'
import { SAMPLE_PROJECT } from '@/data/sampleProject'
import { createId } from '@/utils/cn'

function nowIso(): string {
  return new Date().toISOString()
}

export function createProjectRecord(
  partial: Pick<ProjectRecord, 'projectName' | 'items'> & Partial<ProjectRecord>,
): ProjectRecord {
  const timestamp = nowIso()
  return {
    id: partial.id ?? createId(),
    projectName: partial.projectName,
    version: partial.version ?? PROJECT_VERSION,
    items: partial.items,
    createdAt: partial.createdAt ?? timestamp,
    updatedAt: partial.updatedAt ?? timestamp,
  }
}

export function createSampleProjectRecord(): ProjectRecord {
  return createProjectRecord({
    projectName: SAMPLE_PROJECT.projectName,
    version: SAMPLE_PROJECT.version,
    items: SAMPLE_PROJECT.items.map((item) => ({
      ...item,
      id: createId(),
    })),
  })
}

export function createDefaultAppData(): AppData {
  const sample = createSampleProjectRecord()
  const companySettings = defaultCompanySettings()
  return {
    version: DATA_VERSION,
    projects: [sample],
    materials: [],
    suppliers: [],
    quotes: [],
    companySettings,
    quoteNumberState: defaultQuoteNumberState(companySettings.quotePrefix),
    activeProjectId: sample.id,
  }
}
