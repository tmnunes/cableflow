import type { AppData } from '@/types/app'
import { writeJson } from '@/services/storage/baseStorage'
import { APP_DATA_KEY } from '@/services/storage/keys'

export function saveAppData(data: AppData): void {
  writeJson(APP_DATA_KEY, data)
}

export { loadAppData, mergeAppDataImport, mergeMaterialsImport, mergeSuppliersImport } from '@/services/storage/migration'
