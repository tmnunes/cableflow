import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CircuitEditor } from '@/components/circuits/CircuitEditor'
import { Button } from '@/components/ui/button'
import { useAppData } from '@/hooks/useAppData'
import { createCableRunFromCircuit } from '@/utils/electrical/quoteIntegration'

interface CircuitsPanelProps {
  projectId: string
}

export function CircuitsPanel({ projectId }: CircuitsPanelProps) {
  const { t } = useTranslation()
  const {
    circuits,
    createCircuit,
    upsertCircuit,
    deleteCircuit,
    duplicateCircuit,
    loadTypes,
    materials,
    locale,
    projects,
    updateProject,
  } = useAppData()

  const projectCircuits = circuits.filter((circuit) => circuit.projectId === projectId)
  const project = projects.find((item) => item.id === projectId)

  const addCircuit = () => {
    createCircuit(projectId, t('electricalCircuits.title'))
  }

  return (
    <div className="relative z-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('electricalCircuits.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('electricalCircuits.subtitle')}</p>
        </div>
        <Button type="button" data-testid="add-circuit" onClick={addCircuit}>
          <Plus />
          {t('electricalCircuits.add')}
        </Button>
      </div>

      {projectCircuits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">{t('electricalCircuits.empty')}</p>
          <Button type="button" className="mt-4" data-testid="add-circuit-empty" onClick={addCircuit}>
            <Plus />
            {t('electricalCircuits.add')}
          </Button>
        </div>
      ) : (
        projectCircuits.map((circuit, index) => (
          <CircuitEditor
            key={circuit.id}
            circuit={circuit}
            loadTypes={loadTypes}
            materials={materials}
            locale={locale}
            defaultExpanded={index === projectCircuits.length - 1}
            onChange={upsertCircuit}
            onDuplicate={() => {
              const copy = duplicateCircuit(circuit.id)
              if (copy) toast.success(t('electricalCircuits.duplicated'))
            }}
            onDelete={() => {
              if (window.confirm(t('electricalCircuits.deleteConfirm'))) deleteCircuit(circuit.id)
            }}
            onCreateCableRun={() => {
              if (!project) return
              const result = createCableRunFromCircuit(circuit)
              if ('error' in result) {
                toast.error(t(`electrical.codes.${result.error}`))
                return
              }
              updateProject(project.id, { items: [...project.items, result] })
              upsertCircuit({ ...circuit, linkedCableRunId: result.id })
              toast.success(t('electricalCircuits.cableRunCreated'))
            }}
          />
        ))
      )}
    </div>
  )
}
