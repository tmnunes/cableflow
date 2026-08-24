import type {
  AdditionalProtectionRule,
  RequiredProtection,
  ValidationCheck,
  ValidationResult,
  ValidationStatus,
} from '@/types/electrical'

export interface CoordinationInput {
  designCurrent?: number
  protectionRating?: number
  conductorCapacity?: number
  ampacityConfigured: boolean
}

export function worstStatus(statuses: ValidationStatus[]): ValidationStatus {
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('warning')) return 'warning'
  return 'ok'
}

export function validateProtection(input: CoordinationInput): ValidationResult {
  const checks: ValidationCheck[] = []

  if (
    input.designCurrent === undefined ||
    !Number.isFinite(input.designCurrent) ||
    input.protectionRating === undefined
  ) {
    checks.push({
      id: 'ib-in',
      status: 'warning',
      code: 'protectionNotFullyCalculated',
    })
  } else if (input.designCurrent > input.protectionRating) {
    checks.push({
      id: 'ib-in',
      status: 'error',
      code: 'designCurrentExceedsProtection',
      params: { Ib: input.designCurrent, In: input.protectionRating },
    })
  } else {
    checks.push({
      id: 'ib-in',
      status: 'ok',
      code: 'designCurrentCompatibleWithProtection',
      params: { Ib: input.designCurrent, In: input.protectionRating },
    })
  }

  if (!input.ampacityConfigured || input.conductorCapacity === undefined) {
    checks.push({
      id: 'in-iz',
      status: 'warning',
      code: 'ampacityNotConfigured',
    })
  } else if (
    input.protectionRating !== undefined &&
    input.protectionRating > input.conductorCapacity
  ) {
    checks.push({
      id: 'in-iz',
      status: 'error',
      code: 'protectionExceedsConductorCapacity',
      params: { In: input.protectionRating, Iz: input.conductorCapacity },
    })
  } else if (input.protectionRating !== undefined) {
    checks.push({
      id: 'in-iz',
      status: 'ok',
      code: 'protectionCompatibleWithConductor',
      params: { In: input.protectionRating, Iz: input.conductorCapacity },
    })
  }

  return {
    status: worstStatus(checks.map((check) => check.status)),
    checks,
  }
}

export function additionalProtectionsFromRules(
  rules: AdditionalProtectionRule[],
  category: string,
): RequiredProtection[] {
  return rules
    .filter((rule) => rule.appliesTo === '*' || rule.appliesTo === category)
    .map((rule) => ({
      type: rule.type,
      required: rule.required,
      reason: rule.reason,
      reference: rule.reference,
    }))
}
