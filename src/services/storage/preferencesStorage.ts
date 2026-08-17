import type { Locale, Theme } from '@/types'
import { LOCALE_KEY, THEME_KEY } from '@/services/storage/keys'
import { readJson, writeJson } from '@/services/storage/baseStorage'

export function loadTheme(): Theme {
  const stored = readJson<string>(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function saveTheme(theme: Theme): void {
  writeJson(THEME_KEY, theme)
}

export function loadLocale(): Locale {
  const stored = readJson<string>(LOCALE_KEY)
  if (stored === 'en' || stored === 'pt') return stored
  const nav = navigator.language.toLowerCase()
  return nav.startsWith('pt') ? 'pt' : 'en'
}

export function saveLocale(locale: Locale): void {
  writeJson(LOCALE_KEY, locale)
}
