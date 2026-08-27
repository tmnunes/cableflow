import type { Material } from '@/types/material'

/** Stable ids shared with the Example / Default electrical rule set. */
export const EXAMPLE_PROTECTION_MATERIAL_IDS = {
  mcb55110_1p_c10: 'example-mat-efapel-55110-1p-c10',
  mcb55116_1p_c16: 'example-mat-efapel-55116-1p-c16',
  mcb55120_1p_c20: 'example-mat-efapel-55120-1p-c20',
  mcb55125_1p_c25: 'example-mat-efapel-55125-1p-c25',
  mcb55132_1p_c32: 'example-mat-efapel-55132-1p-c32',
  mcb55140_1p_c40: 'example-mat-efapel-55140-1p-c40',
  mcb55150_1p_c50: 'example-mat-efapel-55150-1p-c50',
  mcb55163_1p_c63: 'example-mat-efapel-55163-1p-c63',
  mcb55116_2p_c16: 'example-mat-efapel-55116-2p-c16',
  mcb55120_2p_c20: 'example-mat-efapel-55120-2p-c20',
  mcb55125_2p_c25: 'example-mat-efapel-55125-2p-c25',
  mcb55132_2p_c32: 'example-mat-efapel-55132-2p-c32',
  mcb55140_2p_c40: 'example-mat-efapel-55140-2p-c40',
  mcb55150_2p_c50: 'example-mat-efapel-55150-2p-c50',
  mcb55163_2p_c63: 'example-mat-efapel-55163-2p-c63',
  mcb55120_3p_c20: 'example-mat-efapel-55120-3p-c20',
  mcb55125_3p_c25: 'example-mat-efapel-55125-3p-c25',
  mcb55132_3p_c32: 'example-mat-efapel-55132-3p-c32',
  mcb55140_3p_c40: 'example-mat-efapel-55140-3p-c40',
  mcb55150_3p_c50: 'example-mat-efapel-55150-3p-c50',
  mcb55163_3p_c63: 'example-mat-efapel-55163-3p-c63',
  rcd55640_4p_40a_30ma: 'example-mat-efapel-55640-4p-40a-30ma',
  rcd55625_4p_25a_30ma: 'example-mat-efapel-55625-4p-25a-30ma',
  rcd55625_4p_25a_300ma: 'example-mat-efapel-55625-4p-25a-300ma',
  busbar4p: 'example-mat-busbar-4p',
  contactorHagerEsc425: 'example-mat-hager-esc425',
  shellyPro3em: 'example-mat-shelly-pro-3em',
} as const

type MaterialIdKey = keyof typeof EXAMPLE_PROTECTION_MATERIAL_IDS

function mcbMaterial(
  key: MaterialIdKey,
  poles: 1 | 2 | 3,
  rating: number,
  code: string,
  noteExtra?: string,
): Omit<Material, 'createdAt' | 'updatedAt'> {
  const poleLabel = poles === 1 ? '1P' : poles === 2 ? '2P' : '3P'
  const exampleNote =
    'Example / Default — reference EFAPEL panel inventory. Confirm model, price and stock before quoting.'
  return {
    id: EXAMPLE_PROTECTION_MATERIAL_IDS[key],
    code,
    name: `EFAPEL Série 55 — MCB ${poleLabel} C${rating} 6kA`,
    category: 'breakers',
    unit: 'unit',
    brand: 'EFAPEL',
    model: code,
    description: `Magnetotérmico ${poleLabel}, curva C, ${rating} A, 6 kA.${noteExtra ? ` ${noteExtra}` : ''}`,
    purchasePrice: 0,
    notes: exampleNote,
    active: true,
  }
}

/**
 * Example / Default protection materials from a reference EFAPEL panel layout.
 * Prices are placeholders — configure purchase/sale values in Materials before quoting.
 */
export function createDefaultProtectionMaterials(timestamp: string): Material[] {
  const exampleNote =
    'Example / Default — reference EFAPEL panel inventory. Confirm model, price and stock before quoting.'

  const items: Omit<Material, 'createdAt' | 'updatedAt'>[] = [
    mcbMaterial('mcb55110_1p_c10', 1, 10, '55110 3CP', 'Fila 1 — lighting.'),
    mcbMaterial('mcb55116_1p_c16', 1, 16, '55116 3CP'),
    mcbMaterial('mcb55120_1p_c20', 1, 20, '55120 3CP'),
    mcbMaterial('mcb55125_1p_c25', 1, 25, '55125 3CP', 'Example ladder extension.'),
    mcbMaterial('mcb55132_1p_c32', 1, 32, '55132 3CP', 'Example ladder extension.'),
    mcbMaterial('mcb55140_1p_c40', 1, 40, '55140 3CP', 'Example ladder — hobs / EV 7.4 kW.'),
    mcbMaterial('mcb55150_1p_c50', 1, 50, '55150 3CP', 'Example ladder extension.'),
    mcbMaterial('mcb55163_1p_c63', 1, 63, '55163 3CP', 'Example ladder extension.'),

    mcbMaterial('mcb55116_2p_c16', 2, 16, '55116'),
    mcbMaterial('mcb55120_2p_c20', 2, 20, '55120'),
    mcbMaterial('mcb55125_2p_c25', 2, 25, '55125', 'Example ladder extension.'),
    mcbMaterial('mcb55132_2p_c32', 2, 32, '55132', 'Example ladder extension.'),
    mcbMaterial('mcb55140_2p_c40', 2, 40, '55140', 'Example ladder — dedicated 1P+N loads.'),
    mcbMaterial('mcb55150_2p_c50', 2, 50, '55150', 'Example ladder extension.'),
    mcbMaterial('mcb55163_2p_c63', 2, 63, '55163', 'Example ladder extension.'),

    mcbMaterial('mcb55120_3p_c20', 3, 20, '55120 3CP'),
    mcbMaterial('mcb55125_3p_c25', 3, 25, '55125 3CP'),
    mcbMaterial('mcb55132_3p_c32', 3, 32, '55132 3CP'),
    mcbMaterial('mcb55140_3p_c40', 3, 40, '55140 3CP', 'Example ladder — heat pumps / hobs.'),
    mcbMaterial('mcb55150_3p_c50', 3, 50, '55150 3CP', 'Example ladder — instantaneous heaters.'),
    mcbMaterial('mcb55163_3p_c63', 3, 63, '55163 3CP', 'Example ladder — EV 22 kW.'),

    {
      id: EXAMPLE_PROTECTION_MATERIAL_IDS.rcd55640_4p_40a_30ma,
      code: '55640 4BC',
      name: 'EFAPEL — RCD 4P 40 A 30 mA (alta sensibilidade)',
      category: 'rcd',
      unit: 'unit',
      brand: 'EFAPEL',
      model: '55640 4BC',
      description: 'Interruptor diferencial tetrapolar, 40 A, 30 mA.',
      purchasePrice: 0,
      notes: exampleNote,
      active: true,
    },
    {
      id: EXAMPLE_PROTECTION_MATERIAL_IDS.rcd55625_4p_25a_30ma,
      code: '55625 4BC',
      name: 'EFAPEL — RCD 4P 25 A 30 mA',
      category: 'rcd',
      unit: 'unit',
      brand: 'EFAPEL',
      model: '55625 4BC',
      description: 'Interruptor diferencial tetrapolar, 25 A, 30 mA.',
      purchasePrice: 0,
      notes: exampleNote,
      active: true,
    },
    {
      id: EXAMPLE_PROTECTION_MATERIAL_IDS.rcd55625_4p_25a_300ma,
      code: '55625 4DC',
      name: 'EFAPEL — RCD 4P 25 A 300 mA',
      category: 'rcd',
      unit: 'unit',
      brand: 'EFAPEL',
      model: '55625 4DC',
      description: 'Interruptor diferencial tetrapolar, 25 A, 300 mA.',
      purchasePrice: 0,
      notes: exampleNote,
      active: true,
    },
    {
      id: EXAMPLE_PROTECTION_MATERIAL_IDS.busbar4p,
      code: 'BUS-4P',
      name: 'Bloco repartidor / barramento 4P',
      category: 'busbar',
      unit: 'unit',
      description: 'Bloco repartidor tetrapolar para calha DIN.',
      purchasePrice: 0,
      notes: `${exampleNote} Configure marca e referência comercial.`,
      active: true,
    },
    {
      id: EXAMPLE_PROTECTION_MATERIAL_IDS.contactorHagerEsc425,
      code: 'ESC425',
      name: 'Hager — Contactor modular ESC425 (25 A, 4NA)',
      category: 'contactors',
      unit: 'unit',
      brand: 'Hager',
      model: 'ESC425',
      description: 'Contactor modular ~25 A, 4NA.',
      purchasePrice: 0,
      notes: exampleNote,
      active: true,
    },
    {
      id: EXAMPLE_PROTECTION_MATERIAL_IDS.shellyPro3em,
      code: 'SHELLY-PRO-3EM',
      name: 'Shelly Pro 3EM — Medidor de energia DIN',
      category: 'devices',
      unit: 'unit',
      brand: 'Shelly',
      model: 'Pro 3EM',
      description: 'Medidor de energia inteligente trifásico em calha DIN, LAN.',
      purchasePrice: 0,
      notes: `${exampleNote} Integração local — não é proteção de circuito.`,
      active: true,
    },
  ]

  return items.map((item) => ({
    ...item,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}
