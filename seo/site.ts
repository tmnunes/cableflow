/** Canonical marketing origin */
export const SITE_ORIGIN = 'https://cableflow.auraconnect.pt'
export const SITE_NAME = 'CableFlow'
export const THEME_COLOR = '#C45C16'

export type Locale = 'pt' | 'en'

export interface PublicPage {
  /** Path with trailing slash, except we normalize */
  path: string
  locale: Locale
  title: string
  description: string
  /** Absolute canonical path (same as path usually) */
  canonicalPath: string
  /** Alternate language path */
  alternatePath: string
  ogImage: string
  /** Body HTML (main content only) */
  bodyHtml: string
  /** Extra JSON-LD graphs (objects) */
  jsonLd: Record<string, unknown>[]
  /** Breadcrumb items for visible + schema (home first optional) */
  breadcrumbs?: { name: string; path: string }[]
  /** Page kind for templates */
  kind: 'landing' | 'guide' | 'tool' | '404'
}

export function absUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${p}`
}

export function normalizePath(path: string): string {
  if (path === '/') return '/'
  const withSlash = path.endsWith('/') ? path : `${path}/`
  return withSlash
}

/** App routes that stay SPA (noindex) */
export const APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/projects',
  '/cables',
  '/circuits',
  '/materials',
  '/load-types',
  '/suppliers',
  '/quotes',
  '/electrical-rules',
  '/settings',
] as const
