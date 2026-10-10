import { SITE_NAME, SITE_ORIGIN, THEME_COLOR, type Locale, type PublicPage, absUrl } from './site.ts'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function langAttr(locale: Locale): string {
  return locale === 'pt' ? 'pt-PT' : 'en'
}

function ogLocale(locale: Locale): string {
  return locale === 'pt' ? 'pt_PT' : 'en_US'
}

function navHtml(locale: Locale): string {
  if (locale === 'pt') {
    return `
<nav class="site-nav" aria-label="Principal">
  <a class="brand" href="/">${esc(SITE_NAME)}</a>
  <div class="nav-links">
    <a href="/guias/metros-de-cabo-por-circuito/">Guias</a>
    <a href="/calculadora-margem-markup/">Calculadora</a>
    <a href="/en/">English</a>
    <a class="btn btn-primary" href="/dashboard">Abrir app</a>
  </div>
</nav>`
  }
  return `
<nav class="site-nav" aria-label="Main">
  <a class="brand" href="/en/">${esc(SITE_NAME)}</a>
  <div class="nav-links">
    <a href="/en/guides/cable-meters-per-circuit/">Guides</a>
    <a href="/en/margin-markup-calculator/">Calculator</a>
    <a href="/">Português</a>
    <a class="btn btn-primary" href="/dashboard">Open app</a>
  </div>
</nav>`
}

function footerHtml(locale: Locale): string {
  if (locale === 'pt') {
    return `
<footer class="site-footer">
  <p><strong>${esc(SITE_NAME)}</strong> — calculadora de cabos elétricos e orçamentos, offline e sem registo.</p>
  <p>
    <a href="/">Início</a> ·
    <a href="/guias/metros-de-cabo-por-circuito/">Metros de cabo</a> ·
    <a href="/guias/margem-vs-markup-orcamentos/">Margem vs markup</a> ·
    <a href="/guias/orcamento-instalacao-eletrica-lista-cabos/">Orçamento</a> ·
    <a href="/calculadora-margem-markup/">Calculadora</a> ·
    <a href="/en/">English</a>
  </p>
</footer>`
  }
  return `
<footer class="site-footer">
  <p><strong>${esc(SITE_NAME)}</strong> — cable length calculator and quotes, offline and no sign-up.</p>
  <p>
    <a href="/en/">Home</a> ·
    <a href="/en/guides/cable-meters-per-circuit/">Cable meters</a> ·
    <a href="/en/guides/margin-vs-markup-quotes/">Margin vs markup</a> ·
    <a href="/en/guides/electrical-quote-from-cable-list/">Quotes</a> ·
    <a href="/en/margin-markup-calculator/">Calculator</a> ·
    <a href="/">Português</a>
  </p>
</footer>`
}

function breadcrumbHtml(page: PublicPage): string {
  if (!page.breadcrumbs?.length) return ''
  const items = page.breadcrumbs
    .map((b, i) => {
      const last = i === page.breadcrumbs!.length - 1
      if (last) return `<li aria-current="page">${esc(b.name)}</li>`
      return `<li><a href="${esc(b.path)}">${esc(b.name)}</a></li>`
    })
    .join('')
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items}</ol></nav>`
}

function websiteSoftwareJsonLd(): Record<string, unknown>[] {
  return [
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: SITE_NAME,
      url: SITE_ORIGIN,
      inLanguage: ['pt-PT', 'en'],
      description:
        'CableFlow — calculate electrical cable lengths, manage materials, and build quotes. Offline-first, no accounts.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_ORIGIN}/#software`,
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_ORIGIN,
      description:
        'Client-side tool for electricians: measure cable runs, catalog materials, and print professional quotes.',
      // TODO: add offers/price when pricing model is decided
    },
  ]
}

export function renderPage(page: PublicPage, extraHead = ''): string {
  const canonical = absUrl(page.canonicalPath)
  const alternate = absUrl(page.alternatePath)
  const ogImage = absUrl(page.ogImage)
  const htmlLang = langAttr(page.locale)
  const robots = page.kind === '404' ? 'noindex, follow' : 'index, follow'

  const graph: Record<string, unknown>[] = [
    ...websiteSoftwareJsonLd(),
    ...page.jsonLd,
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': graph,
  }

  return `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}" />
<meta name="robots" content="${robots}" />
<link rel="canonical" href="${esc(canonical)}" />
<link rel="alternate" hreflang="${page.locale === 'pt' ? 'pt' : 'en'}" href="${esc(canonical)}" />
<link rel="alternate" hreflang="${page.locale === 'pt' ? 'en' : 'pt'}" href="${esc(alternate)}" />
<link rel="alternate" hreflang="x-default" href="${esc(absUrl('/'))}" />
<meta property="og:type" content="${page.kind === 'guide' ? 'article' : 'website'}" />
<meta property="og:site_name" content="${esc(SITE_NAME)}" />
<meta property="og:title" content="${esc(page.title)}" />
<meta property="og:description" content="${esc(page.description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:locale" content="${ogLocale(page.locale)}" />
<meta property="og:locale:alternate" content="${page.locale === 'pt' ? 'en_US' : 'pt_PT'}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(page.title)}" />
<meta name="twitter:description" content="${esc(page.description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
<meta name="theme-color" content="${THEME_COLOR}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@500&amp;display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/seo/site.css" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
${extraHead}
</head>
<body>
<a class="skip-link" href="#main">${page.locale === 'pt' ? 'Saltar para o conteúdo' : 'Skip to content'}</a>
<header class="site-header">
${navHtml(page.locale)}
</header>
<main id="main" class="site-main">
${breadcrumbHtml(page)}
${page.bodyHtml}
</main>
${footerHtml(page.locale)}
</body>
</html>`
}
