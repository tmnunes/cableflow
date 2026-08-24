import type { ElectricalRuleSet, ProtectionOption } from '@/types/electrical'

const EXAMPLE_PROTECTIONS: ProtectionOption[] = [
  { id: 'example-mcb-6', type: 'MCB', rating: 6, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-10', type: 'MCB', rating: 10, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-13', type: 'MCB', rating: 13, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-16', type: 'MCB', rating: 16, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-20', type: 'MCB', rating: 20, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-25', type: 'MCB', rating: 25, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-32', type: 'MCB', rating: 32, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-40', type: 'MCB', rating: 40, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-50', type: 'MCB', rating: 50, poles: 2, curve: 'C', enabled: true },
  { id: 'example-mcb-63', type: 'MCB', rating: 63, poles: 2, curve: 'C', enabled: true },
  { id: 'example-rcd-40-30', type: 'RCD', rating: 40, poles: 2, enabled: true },
  { id: 'example-spd-t2', type: 'SPD', rating: 0, poles: 2, enabled: true },
]

/**
 * Example / Default electrical rule set.
 * Contains configurable placeholders only. Ampacity tables are intentionally empty
 * so the engine will not invent current-carrying capacity.
 */
export const EXAMPLE_ELECTRICAL_RULE_SET: ElectricalRuleSet = {
  id: 'example-default-v1',
  name: 'Example / Default',
  version: '1.0',
  voltage: 230,
  frequency: 50,
  active: true,
  isExample: true,
  notes:
    'Example / Default rule set. Review and replace these values with a verified rule set before relying on recommendations.',
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
    { id: 'unspecified', name: 'Unspecified', notes: 'Example placeholder. Configure a real installation method.' },
  ],
  protectionOptions: EXAMPLE_PROTECTIONS,
  circuitRules: [
    {
      id: 'example-rule-lighting',
      circuitCategory: 'lighting',
      defaultConductorSection: 1.5,
      allowedConductorSections: [1.5, 2.5],
      protectionOptionIds: ['example-mcb-6', 'example-mcb-10', 'example-mcb-16'],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default lighting placeholders.',
    },
    {
      id: 'example-rule-socket',
      circuitCategory: 'socket',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4],
      protectionOptionIds: ['example-mcb-16', 'example-mcb-20'],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default socket placeholders. Not a legal socket-count rule.',
    },
    {
      id: 'example-rule-kitchen',
      circuitCategory: 'kitchen',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6],
      protectionOptionIds: ['example-mcb-16', 'example-mcb-20', 'example-mcb-25', 'example-mcb-32'],
      calculationMethod: 'sumLoads',
      notes: 'Example / Default kitchen placeholders.',
    },
    {
      id: 'example-rule-appliance',
      circuitCategory: 'appliance',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6],
      protectionOptionIds: ['example-mcb-16', 'example-mcb-20', 'example-mcb-25'],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-hvac',
      circuitCategory: 'hvac',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6],
      protectionOptionIds: ['example-mcb-16', 'example-mcb-20', 'example-mcb-25', 'example-mcb-32'],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-water-heating',
      circuitCategory: 'waterHeating',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6],
      protectionOptionIds: ['example-mcb-16', 'example-mcb-20', 'example-mcb-25'],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-motor',
      circuitCategory: 'motor',
      defaultConductorSection: 2.5,
      allowedConductorSections: [2.5, 4, 6, 10],
      protectionOptionIds: ['example-mcb-16', 'example-mcb-20', 'example-mcb-25', 'example-mcb-32'],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-power',
      circuitCategory: 'power',
      defaultConductorSection: 4,
      allowedConductorSections: [4, 6, 10, 16],
      protectionOptionIds: [
        'example-mcb-20',
        'example-mcb-25',
        'example-mcb-32',
        'example-mcb-40',
        'example-mcb-50',
        'example-mcb-63',
      ],
      calculationMethod: 'sumLoads',
    },
    {
      id: 'example-rule-other',
      circuitCategory: 'other',
      allowedConductorSections: [1.5, 2.5, 4, 6, 10, 16],
      protectionOptionIds: EXAMPLE_PROTECTIONS.filter((p) => p.type === 'MCB').map((p) => p.id),
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
  additionalProtectionRules: [],
  simultaneityRules: [
    {
      id: 'example-simultaneity-circuit',
      appliesTo: 'circuit',
      factor: 1,
      notes: 'Example / Default. Configure verified demand factors before using panel totals.',
    },
  ],
  references: [],
}
