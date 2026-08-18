/** Circuit type codes used in electrical projects */
export type CircuitType = 'I' | 'T' | 'P' | 'Q' | 'G'

/** Conductor codes inside a conduit specification */
export type ConductorCode = 'F' | 'R' | 'VJ' | 'N' | 'T'

export interface CircuitTypeDefinition {
  code: CircuitType
  sectionMm2: number
}

export interface ConductorDefinition {
  code: ConductorCode
  /** CSS color token for UI swatches */
  color: string
  /** Tailwind-friendly hex for swatches */
  hex: string
  /** Secondary hex for striped conductors (e.g. earth) */
  hexSecondary?: string
}

export interface ParsedConductor {
  code: ConductorCode
  quantity: number
}

export interface SpecParseResult {
  ok: true
  conductors: ParsedConductor[]
}

export interface SpecParseError {
  ok: false
  error: string
  position?: number
}

export type SpecParseOutcome = SpecParseResult | SpecParseError

export interface ProjectMaterialItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  notes: string
  /** When added from the global catalog */
  catalogMaterialId?: string
  /** Supplier linked via catalog or manually chosen */
  supplierId?: string
  /** Auto-generated from cable calculations — key like "cable:1.5:F" */
  cableSourceKey?: string
}

export interface CableRun {
  id: string
  description: string
  distance: number
  type: CircuitType
  /** Number of conductors the conduit can hold (plain integer, e.g. 4) */
  conduit: number
  spec: string
  notes: string
}

export interface Project {
  projectName: string
  version: number
  items: CableRun[]
  materials?: ProjectMaterialItem[]
}

/** Project with identity and timestamps (v2 storage) */
export interface ProjectRecord extends Project {
  id: string
  createdAt: string
  updatedAt: string
}

/** Exportable JSON shape (ids optional for import flexibility) */
export interface ProjectExport {
  projectName: string
  version: number
  items: Array<{
    id?: string
    description: string
    distance: number
    type: CircuitType
    conduit: number
    spec: string
    notes?: string
  }>
  materials?: Array<{
    id?: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    notes?: string
  }>
}

export interface ConductorLength {
  code: ConductorCode
  meters: number
}

export interface SectionSummary {
  sectionMm2: number
  conductors: ConductorLength[]
  totalMeters: number
}

export interface ProjectTotals {
  totalConduitLength: number
  totalCableLength: number
  totalConductors: number
  cableRuns: number
}

export interface ProjectSummary {
  totals: ProjectTotals
  bySection: SectionSummary[]
}

export type SortField =
  | 'description'
  | 'distance'
  | 'type'
  | 'section'
  | 'conduit'
  | 'spec'
  | 'notes'

export type SortDirection = 'asc' | 'desc'

export interface ValidationErrors {
  description?: string
  distance?: string
  type?: string
  spec?: string
  conduit?: string
}
