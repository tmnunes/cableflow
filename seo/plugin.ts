import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { renderPage } from './layout.ts'
import { getPublicPages, notFoundPage } from './pages.ts'
import { APP_ROUTE_PREFIXES, SITE_ORIGIN, normalizePath } from './site.ts'

function outFileForPath(distDir: string, urlPath: string): string {
  const normalized = normalizePath(urlPath)
  if (normalized === '/') return path.join(distDir, 'index.html')
  const rel = normalized.replace(/^\//, '').replace(/\/$/, '')
  return path.join(distDir, rel, 'index.html')
}

function writePages(distDir: string): void {
  const pages = getPublicPages()
  for (const page of pages) {
    const file = outFileForPath(distDir, page.path)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, renderPage(page), 'utf8')
  }

  const notFound = notFoundPage()
  fs.writeFileSync(path.join(distDir, '404.html'), renderPage(notFound), 'utf8')

  const lastmod = new Date().toISOString().slice(0, 10)
  const urlEntries = pages
    .filter((p) => p.kind !== '404')
    .map((p) => {
      const loc = `${SITE_ORIGIN}${normalizePath(p.canonicalPath) === '/' ? '/' : normalizePath(p.canonicalPath)}`
      const alt = `${SITE_ORIGIN}${normalizePath(p.alternatePath) === '/' ? '/' : normalizePath(p.alternatePath)}`
      const hreflangSelf = p.locale === 'pt' ? 'pt' : 'en'
      const hreflangAlt = p.locale === 'pt' ? 'en' : 'pt'
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="${hreflangSelf}" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="${hreflangAlt}" href="${alt}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />
  </url>`
    })
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>
`
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')
}

function isAppPath(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function findPublicPage(pathname: string) {
  const pages = getPublicPages()
  const candidates = [pathname, normalizePath(pathname), pathname.endsWith('/') ? pathname.slice(0, -1) : `${pathname}/`]
  return pages.find((p) => candidates.includes(p.path) || candidates.includes(normalizePath(p.canonicalPath)))
}

function attachDevMiddleware(server: ViteDevServer): void {
  server.middlewares.use((req, res, next) => {
    const raw = req.url ?? '/'
    const pathname = raw.split('?')[0] ?? '/'

    if (
      pathname.startsWith('/src/') ||
      pathname.startsWith('/@') ||
      pathname.startsWith('/node_modules') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/seo/') ||
      pathname.startsWith('/og/') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/apple-touch')
    ) {
      return next()
    }

    if (isAppPath(pathname) || pathname === '/app.html') {
      req.url = '/app.html' + (raw.includes('?') ? raw.slice(raw.indexOf('?')) : '')
      return next()
    }

    if (pathname === '/sitemap.xml') {
      // regenerate lightly for lastmod
      const tmp = path.join(server.config.root, 'dist-seo-dev')
      fs.mkdirSync(tmp, { recursive: true })
      writePages(tmp)
      const xml = fs.readFileSync(path.join(tmp, 'sitemap.xml'), 'utf8')
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/xml; charset=utf-8')
      res.end(xml)
      return
    }

    const page = findPublicPage(pathname)
    if (page) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      // Dev: calculator loads TS source via Vite
      const html = renderPage(page).replaceAll(
        'src="/seo/calculator.js"',
        'src="/src/public-site/calculator-main.ts"',
      )
      res.end(html)
      return
    }

    if (pathname === '/' || pathname === '/index.html') {
      const home = getPublicPages().find((p) => p.path === '/')!
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(renderPage(home))
      return
    }

    // Unknown public path → real 404 HTML (not SPA soft 404)
    if (!pathname.includes('.')) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(renderPage(notFoundPage()))
      return
    }

    next()
  })
}

export function seoPublicPagesPlugin(): Plugin {
  let outDir = 'dist'
  let root = process.cwd()

  return {
    name: 'cableflow-seo-public-pages',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      root = config.root
    },
    configureServer(server) {
      attachDevMiddleware(server)
    },
    configurePreviewServer(server) {
      // Preview serves files from dist; ensure 404 for unknown non-file paths is not needed if 404.html exists
      void server
    },
    writeBundle() {
      writePages(outDir)
      // Ensure robots.txt exists (copied from public, but assert)
      const robotsSrc = path.join(root, 'public', 'robots.txt')
      if (fs.existsSync(robotsSrc)) {
        fs.copyFileSync(robotsSrc, path.join(outDir, 'robots.txt'))
      }
    },
  }
}
