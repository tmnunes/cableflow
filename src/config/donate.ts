/** Public Ko-fi page — safe to expose in the browser bundle (not a secret). */
const DEFAULT_KOFI_URL = 'https://ko-fi.com/T8U0277408'
const KOFI_BADGE_SRC = 'https://storage.ko-fi.com/cdn/kofi6.png?v=6'

export function getKofiUrl(): string {
  const url = (import.meta.env.VITE_KOFI_URL as string | undefined)?.trim()
  return url || DEFAULT_KOFI_URL
}

export function getKofiBadgeSrc(): string {
  return KOFI_BADGE_SRC
}

export function isDonateConfigured(): boolean {
  return Boolean(getKofiUrl())
}
