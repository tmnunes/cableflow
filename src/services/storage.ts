import type { Locale, Project, Theme } from '@/types'
import { LOCALE_KEY, STORAGE_KEY, THEME_KEY } from '@/data/circuits'
import { SAMPLE_PROJECT } from '@/data/sampleProject'
import { validateAndNormalize } from '@/services/importExport'
import { createId } from '@/utils/cn'

export function loadProject(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return cloneSample()
    }
    const parsed = JSON.parse(raw) as unknown
    const result = validateAndNormalize(parsed)
    if (result.ok) {
      return result.project
    }
  } catch {
    // fall through to sample
  }
  return cloneSample()
}

export function saveProject(project: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  } catch {
    // Storage may be full or unavailable — ignore gracefully
  }
}

export function clearStoredProject(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
}

export function loadLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'en' || stored === 'pt') return stored
  const nav = navigator.language.toLowerCase()
  return nav.startsWith('pt') ? 'pt' : 'en'
}

export function saveLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale)
}

function cloneSample(): Project {
  return {
    ...SAMPLE_PROJECT,
    items: SAMPLE_PROJECT.items.map((item) => ({
      ...item,
      id: createId(),
    })),
  }
}
