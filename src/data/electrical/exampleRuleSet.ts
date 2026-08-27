import type { ElectricalRuleSet, ProtectionOption } from '@/types/electrical'
import { EXAMPLE_PROTECTION_MATERIAL_IDS } from '@/data/electrical/exampleProtectionMaterials'

const M = EXAMPLE_PROTECTION_MATERIAL_IDS

const EXAMPLE_PROTECTIONS: ProtectionOption[] = [
  // MCB 1P EFAPEL Série 55, 6 kA
  {
    id: 'example-mcb-1p-c10',
    type: 'MCB',
    rating: 10,
    poles: 1,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55110_1p_c10,
    enabled: true,
  },
  {
    id: 'example-mcb-1p-c16',
    type: 'MCB',
    rating: 16,
    poles: 1,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55116_1p_c16,
    enabled: true,
  },
  {
    id: 'example-mcb-1p-c20',
    type: 'MCB',
    rating: 20,
    poles: 1,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55120_1p_c20,
    enabled: true,
  },
  {
    id: 'example-mcb-1p-c25',
    type: 'MCB',
    rating: 25,
    poles: 1,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55125_1p_c25,
    enabled: true,
  },
  {
    id: 'example-mcb-1p-c32',
    type: 'MCB',
    rating: 32,
    poles: 1,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55132_1p_c32,
    enabled: true,
  },
  // MCB 2P / 1P+N
  {
    id: 'example-mcb-2p-c16',
    type: 'MCB',
    rating: 16,
    poles: 2,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55116_2p_c16,
    enabled: true,
  },
  {
    id: 'example-mcb-2p-c20',
    type: 'MCB',
    rating: 20,
    poles: 2,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55120_2p_c20,
    enabled: true,
  },
  {
    id: 'example-mcb-2p-c25',
    type: 'MCB',
    rating: 25,
    poles: 2,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55125_2p_c25,
    enabled: true,
  },
  {
    id: 'example-mcb-2p-c32',
    type: 'MCB',
    rating: 32,
    poles: 2,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55132_2p_c32,
    enabled: true,
  },
  // MCB 3P
  {
    id: 'example-mcb-3p-c20',
    type: 'MCB',
    rating: 20,
    poles: 3,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55120_3p_c20,
    enabled: true,
  },
  {
    id: 'example-mcb-3p-c25',
    type: 'MCB',
    rating: 25,
    poles: 3,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55125_3p_c25,
    enabled: true,
  },
  {
    id: 'example-mcb-3p-c32',
    type: 'MCB',
    rating: 32,
    poles: 3,
    curve: 'C',
    breakingCapacity: 6,
    materialId: M.mcb55132_3p_c32,
    enabled: true,
  },
  // RCD 4P EFAPEL
  {
    id: 'example-rcd-4p-40-30',
    type: 'RCD',
    rating: 40,
    poles: 4,
    materialId: M.rcd55640_4p_40a_30ma,
    enabled: true,
  },
  {
    id: 'example-rcd-4p-25-30',
    type: 'RCD',
    rating: 25,
    poles: 4,
    materialId: M.rcd55625_4p_25a_30ma,
    enabled: true,
  },
  {
    id: 'example-rcd-4p-25-300',
    type: 'RCD',
    rating: 25,
    poles: 4,
    materialId: M.rcd55625_4p_25a_300ma,
    enabled: true,
  },
]

const MCB_1P_IDS = [
  'example-mcb-1p-c10',
  'example-mcb-1p-c16',
  'example-mcb-1p-c20',
  'example-mcb-1p-c25',
  'example-mcb-1p-c32',
] as const
const MCB_2P_IDS = [
  'example-mcb-2p-c16',
  'example-mcb-2p-c20',
  'example-mcb-2p-c25',
  'example-mcb-2p-c32',
] as const
const MCB_3P_IDS = ['example-mcb-3p-c20', 'example-mcb-3p-c25', 'example-mcb-3p-c32'] as const

/** Common single-phase ladder through 32 A for dedicated / higher loads. */
const SINGLE_PHASE_TO_32 = [
  'example-mcb-1p-c16',
  'example-mcb-1p-c20',
  'example-mcb-1p-c25',
  'example-mcb-1p-c32',
  'example-mcb-2p-c16',
  'example-mcb-2p-c20',
  'example-mcb-2p-c25',
  'example-mcb-2p-c32',
] as const

/**
 * Example / Default electrical rule set.
 * Protection options reference the Example / Default EFAPEL materials catalog.
 * Ampacity tables are intentionally empty so the engine will not invent Iz.
 */
export const EXAMPLE_ELECTRICAL_RULE_SET: ElectricalRuleSet = {
  id: 'example-default-v1',
  name: 'Example / Default',
  version: '1.4',
  voltage: 230,
  frequency: 50,
  active: true,
  isExample: true,
  notes:
    'Example / Default rule set aligned with an EFAPEL Série 55 reference panel. Review and replace these values with a verified rule set before relying on recommendations.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  defaults: {
    systemPhase: 'single-phase',
    voltage: 230,
    frequency: 50,
    powerFactor: 1,
    utilizationFactor: 1,
    simultaneityFactor: 1,
    maxVoltageDropPercent: 3,
    availableSectionsMm2: [1.5, 2.5, 4, 6, 10, 16, 25, 35],
    conductorMaterial: 'copper',
    conductorResistivityOhmMm2PerM: 0.0225,
    conductorReactanceOhmPerKm: 0.08,
  },
  installationMethods: [
    {
      id: 'unspecified',
      name: 'Unspecified',
      notes: 'Example placeholder. Use when no ampacity table by method is configured yet.',
    },
    {
      id: 'example-clipped-direct',
      name: 'Example — clipped direct / surface',
      notes: 'Example / Default label only. Add a matching ampacity table under Current-carrying capacity before validating.',
    },
    {
      id: 'example-in-conduit',
      name: 'Example — in conduit / trunking',
      notes: 'Example / Default label only. Add a matching ampacity table under Current-carrying capacity before validating.',
    },
  ],
  protectionOptions: EXAMPLE_PROTECTIONS,
  circuitRules: [
    {
      id: 'example-rule-lighting',
      circuitCategory: 'lighting',
      defaultConductorSection: 1.5,
      allowedConductorSections: [1.5, 2.5],
      protectionOptionIds: ['example-mcb-1p-c10', 'example-mcb-1p-c16'],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — MCB 1P C10/C16 (EFAPEL 55110/55116).',
    },
    {
      id: 'example-rule-socket',
      circuitCategory: 'socket',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4],
      protectionOptionIds: ['example-mcb-1p-c16', 'example-mcb-1p-c20'],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — MCB 1P C16/C20. Not a legal socket-count rule.',
    },
    {
      id: 'example-rule-kitchen',
      circuitCategory: 'kitchen',
      defaultConductorSection: 4,
      allowedConductorSections: [2.5, 4, 6, 10],
      protectionOptionIds: [...SINGLE_PHASE_TO_32, ...MCB_3P_IDS],
      calculationMethod: 'sumLoads',
      notes:
        'Example / Default — includes 3P up to 32 A for three-phase hobs / dedicated kitchen loads (e.g. 11 kW).',
    },
    {
      id: 'example-rule-appliance',
      circuitCategory: 'appliance',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6, 10],
      protectionOptionIds: [...SINGLE_PHASE_TO_32, ...MCB_3P_IDS],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-hvac',
      circuitCategory: 'hvac',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6, 10],
      protectionOptionIds: [...SINGLE_PHASE_TO_32, ...MCB_3P_IDS],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — includes 3P up to 32 A so Ib just above 25 A can be covered.',
    },
    {
      id: 'example-rule-water-heating',
      circuitCategory: 'waterHeating',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6],
      protectionOptionIds: [...SINGLE_PHASE_TO_32],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-motor',
      circuitCategory: 'motor',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6, 10],
      protectionOptionIds: [...SINGLE_PHASE_TO_32, ...MCB_3P_IDS],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-power',
      circuitCategory: 'power',
      defaultConductorSection: 4,
      allowedConductorSections: [4, 6, 10, 16],
      protectionOptionIds: [...MCB_2P_IDS, ...MCB_3P_IDS],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — cargas dedicadas / EV (ex.: MCB 2P/3P até 32 A).',
    },
    {
      id: 'example-rule-other',
      circuitCategory: 'other',
      allowedConductorSections: [1.5, 2.5, 4, 6, 10, 16],
      protectionOptionIds: [...MCB_1P_IDS, ...MCB_2P_IDS, ...MCB_3P_IDS],
      calculationMethod: 'sumLoads',
    },
  ],
  conductorRules: [
    {
      id: 'example-conductor-unspecified',
      conductorMaterial: 'copper',
      installationMethodId: 'unspecified',
      ampacityBySection: [],
      notes: 'Ampacity table intentionally empty. Configure verified current-carrying capacity before validating conductors.',
    },
  ],
  additionalProtectionRules: [
    {
      id: 'example-add-rcd-40-30',
      type: 'RCD',
      appliesTo: 'socket',
      required: false,
      reason: 'Example / Default — RCD 4P 40 A 30 mA (55640 4BC) when required by the installation design.',
      reference: { notes: 'Configure requirement in a verified rule set.' },
    },
  ],
  simultaneityRules: [
    {
      id: 'example-simultaneity-circuit',
      appliesTo: 'circuit',
      factor: 1,
      notes: 'Example / Default. Configure verified demand factors before using panel totals.',
    },
  ],
  references: [
    {
      source: 'Example / Default panel inventory',
      document: 'EFAPEL Série 55 / 556xx',
      notes: 'Reference MCB and RCD models supplied by the installer. Not a legal certification.',
    },
  ],
}
