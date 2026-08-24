export const CIRCUIT_CATEGORIES = [
  'lighting',
  'socket',
  'kitchen',
  'appliance',
  'hvac',
  'waterHeating',
  'motor',
  'power',
  'other',
] as const

export type CircuitCategory = (typeof CIRCUIT_CATEGORIES)[number] | (string & {})

export type ElectricalSystem = 'single-phase' | 'three-phase'

export type ConductorMaterial = 'copper' | 'aluminum' | 'other'

export type ProtectionKind = 'MCB' | 'RCBO' | 'RCD' | 'SPD' | 'other'

export type ValidationStatus = 'ok' | 'warning' | 'error'

export type LoadTypeUnit = 'unit' | 'meter' | 'other'

export interface RuleReference {
  source?: string
  document?: string
  section?: string
  version?: string
  notes?: string
}

export interface LoadType {
  id: string
  name: string
  category: CircuitCategory
  defaultUnitPower: number
  unit: LoadTypeUnit
  defaultPowerFactor?: number
  defaultUtilizationFactor?: number
  defaultSimultaneityFactor?: number
  notes?: string
  active: boolean
  isExample?: boolean
  createdAt: string
  updatedAt: string
}

export interface CircuitLoad {
  id: string
  loadTypeId?: string
  description?: string
  quantity: number
  unitPower: number
  powerFactor?: number
  utilizationFactor?: number
  simultaneityFactor?: number
  notes?: string
}

export interface InstallationParameters {
  systemPhase?: ElectricalSystem
  voltage?: number
  frequency?: number
  conductorMaterial?: ConductorMaterial
  installationMethodId?: string
  loadedConductors?: number
  ambientTemperature?: number
  length?: number
  maxVoltageDropPercent?: number
  notes?: string
}

export interface ValidationCheck {
  id: string
  status: ValidationStatus
  code: string
  params?: Record<string, string | number>
}

export interface ValidationResult {
  status: ValidationStatus
  checks: ValidationCheck[]
}

export interface VoltageDropResult {
  voltageDrop?: number
  voltageDropPercent?: number
  limitPercent?: number
  calculated: boolean
  warnings: string[]
  errors: string[]
}

export interface ConductorSizingResult {
  recommendedSection?: number
  alternatives?: number[]
  currentCapacity?: number
  voltageDrop?: number
  voltageDropPercent?: number
  recommendationBasis: 'ampacity' | 'ruleDefault' | 'none'
  warnings: string[]
  errors: string[]
}

export interface ProtectionOption {
  id: string
  type: ProtectionKind
  rating: number
  poles?: number
  curve?: string
  breakingCapacity?: number
  compatibleSections?: number[]
  enabled: boolean
  materialId?: string
}

export interface ProtectionRecommendation {
  option?: ProtectionOption
  calculated: boolean
  validated: boolean
  warnings: string[]
  errors: string[]
}

export interface RequiredProtection {
  type: ProtectionKind
  required: boolean
  reason?: string
  recommended?: ProtectionOption
  materialId?: string
  reference?: RuleReference
}

export interface CircuitDesignResult {
  installedPower: number
  designPower: number
  designCurrent: number
  powerFactor?: number
  systemPhase: ElectricalSystem
  voltage: number
  conductor?: ConductorSizingResult
  protection?: ProtectionRecommendation
  additionalProtections: RequiredProtection[]
  validation: ValidationResult
  warnings: string[]
  errors: string[]
  ruleSetId: string
  ruleSetVersion: string
  calculatedAt: string
}

export interface Circuit {
  id: string
  projectId: string
  code?: string
  name: string
  category: CircuitCategory
  loads: CircuitLoad[]
  installation?: InstallationParameters
  design?: CircuitDesignResult
  selectedProtectionMaterialId?: string
  selectedCableMaterialId?: string
  linkedCableRunId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AmpacityEntry {
  sectionMm2: number
  currentA: number
}

export interface ConductorRule {
  id: string
  conductorMaterial: ConductorMaterial
  installationMethodId?: string
  loadedConductors?: number
  ampacityBySection: AmpacityEntry[]
  notes?: string
  reference?: RuleReference
}

export interface CircuitRule {
  id: string
  circuitCategory: CircuitCategory
  defaultConductorSection?: number
  allowedConductorSections: number[]
  protectionOptionIds: string[]
  calculationMethod: 'sumLoads' | 'other'
  maxCurrent?: number
  maxVoltageDropPercent?: number
  additionalProtectionIds?: string[]
  notes?: string
  reference?: RuleReference
}

export interface SimultaneityRule {
  id: string
  appliesTo: 'circuit' | 'group' | 'project' | 'panel' | string
  circuitCategory?: CircuitCategory
  factor: number
  notes?: string
  reference?: RuleReference
}

export interface AdditionalProtectionRule {
  id: string
  type: ProtectionKind
  appliesTo: CircuitCategory | '*'
  required: boolean
  reason?: string
  reference?: RuleReference
}

export interface ElectricalDefaults {
  systemPhase: ElectricalSystem
  voltage: number
  frequency?: number
  powerFactor?: number
  utilizationFactor?: number
  simultaneityFactor?: number
  maxVoltageDropPercent?: number
  availableSectionsMm2: number[]
  conductorMaterial: ConductorMaterial
  /** Example resistivity in Ω·mm²/m. Leave undefined to skip voltage-drop calculation. */
  conductorResistivityOhmMm2PerM?: number
  /** Example reactance in Ω/km. Optional. */
  conductorReactanceOhmPerKm?: number
}

export interface ElectricalRuleSet {
  id: string
  name: string
  version: string
  voltage: number
  frequency?: number
  defaults: ElectricalDefaults
  circuitRules: CircuitRule[]
  conductorRules: ConductorRule[]
  protectionOptions: ProtectionOption[]
  additionalProtectionRules: AdditionalProtectionRule[]
  simultaneityRules: SimultaneityRule[]
  installationMethods: Array<{ id: string; name: string; notes?: string }>
  references?: RuleReference[]
  active: boolean
  isExample?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProtectionSummaryItem {
  key: string
  type: ProtectionKind
  rating?: number
  poles?: number
  curve?: string
  count: number
  materialId?: string
}

export interface PanelCircuitRow {
  circuitId: string
  name: string
  category: CircuitCategory
  installedPower: number
  designPower: number
  designCurrent: number
  sectionMm2?: number
  protectionLabel?: string
  validation: ValidationStatus
}
