import type { Project } from '@/types'
import { PROJECT_VERSION } from '@/data/circuits'

function id(suffix: string): string {
  return `sample-${suffix}`
}

/** Preloaded sample project so the app is useful on first open */
export const SAMPLE_PROJECT: Project = {
  projectName: 'Villa Algarve',
  version: PROJECT_VERSION,
  items: [
    {
      id: id('1'),
      description: 'Q1.1',
      distance: 5,
      type: 'I',
      conduit: 3,
      spec: 'FTN',
      notes: 'Kitchen lighting',
    },
    {
      id: id('2'),
      description: 'Q1.2',
      distance: 8,
      type: 'I',
      conduit: 4,
      spec: '2VJTN',
      notes: 'Stair 3-way switching',
    },
    {
      id: id('3'),
      description: 'Q2.1',
      distance: 12,
      type: 'T',
      conduit: 3,
      spec: 'FTN',
      notes: 'Living room sockets',
    },
    {
      id: id('4'),
      description: 'Q2.2',
      distance: 6,
      type: 'T',
      conduit: 3,
      spec: 'F2R',
      notes: '',
    },
    {
      id: id('5'),
      description: 'Q3.1',
      distance: 15,
      type: 'P',
      conduit: 3,
      spec: 'FTN',
      notes: 'Oven circuit',
    },
    {
      id: id('6'),
      description: 'Q4.1',
      distance: 20,
      type: 'Q',
      conduit: 5,
      spec: '3F2N',
      notes: 'AC outdoor unit',
    },
    {
      id: id('7'),
      description: 'Q0.1',
      distance: 25,
      type: 'G',
      conduit: 4,
      spec: '4VJ',
      notes: 'Main feed spare travellers',
    },
    {
      id: id('8'),
      description: 'Q1.3',
      distance: 7,
      type: 'I',
      conduit: 4,
      spec: 'FRTN',
      notes: 'Bathroom lighting + return',
    },
  ],
}
