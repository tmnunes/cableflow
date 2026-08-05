import type { CableRun, CircuitType, ValidationErrors } from '@/types'
import { CIRCUIT_TYPE_MAP } from '@/data/circuits'
import { countConductors, parseSpec } from '@/utils/parser'

export function validateCableRun(
  run: Partial<CableRun>,
  t: (key: string, options?: Record<string, unknown>) => string,
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!run.description?.trim()) {
    errors.description = t('validation.descriptionRequired')
  }

  if (run.distance === undefined || run.distance === null || Number.isNaN(run.distance)) {
    errors.distance = t('validation.distanceRequired')
  } else if (run.distance <= 0) {
    errors.distance = t('validation.distancePositive')
  }

  if (!run.type || !CIRCUIT_TYPE_MAP[run.type]) {
    errors.type = t('validation.circuitRequired')
  }

  const conduit = run.conduit
  const conduitMissing =
    conduit === undefined || conduit === null || Number.isNaN(conduit as number)
  if (conduitMissing) {
    errors.conduit = t('validation.conduitRequired')
  } else if (!Number.isInteger(conduit) || conduit < 1) {
    errors.conduit = t('validation.conduitPositive')
  }

  if (!run.spec?.trim()) {
    errors.spec = t('validation.specRequired')
  } else {
    const parsed = parseSpec(run.spec)
    if (!parsed.ok) {
      errors.spec = t(`validation.spec.${parsed.error}`)
    } else if (!conduitMissing && Number.isInteger(conduit) && conduit >= 1) {
      const specCount = countConductors(parsed.conductors)
      if (specCount !== conduit) {
        const message = t('validation.conduitSpecMismatch', {
          conduit,
          specCount,
        })
        errors.conduit = message
        errors.spec = message
      }
    }
  }

  return errors
}

export function isCableRunValid(
  run: Partial<CableRun>,
  t: (key: string, options?: Record<string, unknown>) => string,
): boolean {
  return Object.keys(validateCableRun(run, t)).length === 0
}

export function isCircuitType(value: string): value is CircuitType {
  return value in CIRCUIT_TYPE_MAP
}
