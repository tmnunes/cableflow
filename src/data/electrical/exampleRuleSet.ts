import type { ElectricalRuleSet, ProtectionOption } from '@/types/electrical'
import { EXAMPLE_PROTECTION_MATERIAL_IDS } from '@/data/electrical/exampleProtectionMaterials'

const M = EXAMPLE_PROTECTION_MATERIAL_IDS

function mcb(
  id: string,
  rating: number,
  poles: 1 | 2 | 3,
  materialId: string,
): ProtectionOption {
  return {
    id,
    type: 'MCB',
    rating,
    poles,
    curve: 'C',
    breakingCapacity: 6,
    materialId,
    enabled: true,
  }
}

const EXAMPLE_PROTECTIONS: ProtectionOption[] = [
  mcb('example-mcb-1p-c10', 10, 1, M.mcb55110_1p_c10),
  mcb('example-mcb-1p-c16', 16, 1, M.mcb55116_1p_c16),
  mcb('example-mcb-1p-c20', 20, 1, M.mcb55120_1p_c20),
  mcb('example-mcb-1p-c25', 25, 1, M.mcb55125_1p_c25),
  mcb('example-mcb-1p-c32', 32, 1, M.mcb55132_1p_c32),
  mcb('example-mcb-1p-c40', 40, 1, M.mcb55140_1p_c40),
  mcb('example-mcb-1p-c50', 50, 1, M.mcb55150_1p_c50),
  mcb('example-mcb-1p-c63', 63, 1, M.mcb55163_1p_c63),

  mcb('example-mcb-2p-c16', 16, 2, M.mcb55116_2p_c16),
  mcb('example-mcb-2p-c20', 20, 2, M.mcb55120_2p_c20),
  mcb('example-mcb-2p-c25', 25, 2, M.mcb55125_2p_c25),
  mcb('example-mcb-2p-c32', 32, 2, M.mcb55132_2p_c32),
  mcb('example-mcb-2p-c40', 40, 2, M.mcb55140_2p_c40),
  mcb('example-mcb-2p-c50', 50, 2, M.mcb55150_2p_c50),
  mcb('example-mcb-2p-c63', 63, 2, M.mcb55163_2p_c63),

  mcb('example-mcb-3p-c20', 20, 3, M.mcb55120_3p_c20),
  mcb('example-mcb-3p-c25', 25, 3, M.mcb55125_3p_c25),
  mcb('example-mcb-3p-c32', 32, 3, M.mcb55132_3p_c32),
  mcb('example-mcb-3p-c40', 40, 3, M.mcb55140_3p_c40),
  mcb('example-mcb-3p-c50', 50, 3, M.mcb55150_3p_c50),
  mcb('example-mcb-3p-c63', 63, 3, M.mcb55163_3p_c63),

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
  'example-mcb-1p-c40',
  'example-mcb-1p-c50',
  'example-mcb-1p-c63',
] as const

const MCB_2P_IDS = [
  'example-mcb-2p-c16',
  'example-mcb-2p-c20',
  'example-mcb-2p-c25',
  'example-mcb-2p-c32',
  'example-mcb-2p-c40',
  'example-mcb-2p-c50',
  'example-mcb-2p-c63',
] as const

const MCB_3P_IDS = [
  'example-mcb-3p-c20',
  'example-mcb-3p-c25',
  'example-mcb-3p-c32',
  'example-mcb-3p-c40',
  'example-mcb-3p-c50',
  'example-mcb-3p-c63',
] as const

/** Dedicated dwelling loads — single-phase ladder through 63 A. */
const SINGLE_PHASE_TO_63 = [
  'example-mcb-1p-c16',
  'example-mcb-1p-c20',
  'example-mcb-1p-c25',
  'example-mcb-1p-c32',
  'example-mcb-1p-c40',
  'example-mcb-1p-c50',
  'example-mcb-1p-c63',
  ...MCB_2P_IDS,
] as const

/** Kitchen / HVAC / motor / power — 1P+2P+3P through 63 A. */
const DWELLING_DEDICATED = [...SINGLE_PHASE_TO_63, ...MCB_3P_IDS] as const

/**
 * Example / Default electrical rule set.
 * Protection options reference the Example / Default EFAPEL materials catalog.
 * Ampacity tables are intentionally empty so the engine will not invent Iz.
 *
 * MCB ladder through 63 A covers typical dwelling equipment (induction hobs,
 * instantaneous heaters, heat pumps, EV chargers) without inventing legal Iz.
 */
export const EXAMPLE_ELECTRICAL_RULE_SET: ElectricalRuleSet = {
  id: 'example-default-v1',
  name: 'Example / Default',
  version: '1.5',
  voltage: 230,
  frequency: 50,
  active: true,
  isExample: true,
  notes:
    'Example / Default rule set for typical dwellings (kitchen, laundry, HVAC, pumps, EV). Review and replace with a verified rule set before relying on recommendations.',
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
      notes: 'Example / Default — MCB 1P C10/C16.',
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
      allowedConductorSections: [2.5, 4, 6, 10, 16],
      protectionOptionIds: [...DWELLING_DEDICATED],
      calculationMethod: 'sumLoads',
      notes:
        'Example / Default — fridge, oven, induction hob 1P/3P, dishwasher. Ladder to 63 A.',
    },
    {
      id: 'example-rule-appliance',
      circuitCategory: 'appliance',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6, 10],
      protectionOptionIds: [...DWELLING_DEDICATED],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — washing machine, dryer, washer-dryer.',
    },
    {
      id: 'example-rule-hvac',
      circuitCategory: 'hvac',
      defaultConductorSection: 4,
      allowedConductorSections: [2.5, 4, 6, 10, 16],
      protectionOptionIds: [...DWELLING_DEDICATED],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — AC, heat pump 1P/3P. Ladder to 63 A.',
    },
    {
      id: 'example-rule-water-heating',
      circuitCategory: 'waterHeating',
      defaultConductorSection: 4,
      allowedConductorSections: [2.5, 4, 6, 10, 16],
      protectionOptionIds: [...DWELLING_DEDICATED],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — storage + instantaneous 1P/3P heaters.',
    },
    {
      id: 'example-rule-motor',
      circuitCategory: 'motor',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6, 10, 16],
      protectionOptionIds: [...DWELLING_DEDICATED],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — pool, sewage, well and circulation pumps.',
    },
    {
      id: 'example-rule-power',
      circuitCategory: 'power',
      defaultConductorSection: 6,
      allowedConductorSections: [4, 6, 10, 16, 25],
      protectionOptionIds: [...MCB_2P_IDS, ...MCB_3P_IDS],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default — EV chargers 7.4 / 11 / 22 kW. Ladder to 63 A.',
    },
    {
      id: 'example-rule-other',
      circuitCategory: 'other',
      allowedConductorSections: [1.5, 2.5, 4, 6, 10, 16, 25],
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
      reason: 'Example / Default — RCD 4P 40 A 30 mA when required by the installation design.',
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
      source: 'Example / Default dwelling equipment catalog',
      document: 'EFAPEL Série 55 / 556xx',
      notes: 'Reference MCB ladder through 63 A for typical home loads. Not a legal certification.',
    },
  ],
}
