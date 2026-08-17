import type { CircuitTypeDefinition, ConductorCode, ConductorDefinition } from '@/types'

/** Circuit type → automatic cable section (mm²). User never picks section manually. */
export const CIRCUIT_TYPES: readonly CircuitTypeDefinition[] = [
  { code: 'I', sectionMm2: 1.5 },
  { code: 'T', sectionMm2: 2.5 },
  { code: 'P', sectionMm2: 4 },
  { code: 'Q', sectionMm2: 10 },
  { code: 'G', sectionMm2: 16 },
] as const

export const CIRCUIT_TYPE_MAP: Record<string, CircuitTypeDefinition> = Object.fromEntries(
  CIRCUIT_TYPES.map((c) => [c.code, c]),
)

/** Conductor catalogue — extend here for future codes */
export const CONDUCTORS: readonly ConductorDefinition[] = [
  { code: 'F', color: 'brown', hex: '#8B5A2B' },
  { code: 'R', color: 'orange', hex: '#E67E22' },
  { code: 'VJ', color: 'grey', hex: '#7F8C8D' },
  { code: 'N', color: 'blue', hex: '#2980B9' },
  { code: 'T', color: 'greenYellow', hex: '#27AE60', hexSecondary: '#F1C40F' },
] as const

export const CONDUCTOR_MAP: Record<ConductorCode, ConductorDefinition> = Object.fromEntries(
  CONDUCTORS.map((c) => [c.code, c]),
) as Record<ConductorCode, ConductorDefinition>

/**
 * Codes sorted longest-first so "VJ" matches before a hypothetical single letter.
 * Add new codes to CONDUCTORS and they are picked up automatically.
 */
export const CONDUCTOR_CODES_BY_LENGTH: readonly ConductorCode[] = [...CONDUCTORS]
  .map((c) => c.code)
  .sort((a, b) => b.length - a.length)

export {
  PROJECT_VERSION,
  LEGACY_PROJECT_KEY as STORAGE_KEY,
  THEME_KEY,
  LOCALE_KEY,
} from '@/services/storage/keys'
