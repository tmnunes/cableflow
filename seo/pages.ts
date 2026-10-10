import { faqEn, faqJsonLd, faqPt } from './content/faq.ts'
import { landingBodyEn, landingBodyPt } from './content/landing.ts'
import {
  guideCableMetersEn,
  guideMarginMarkupEn,
  guideQuoteFromCablesEn,
} from './content/guides-en.ts'
import {
  guideCableMetersPt,
  guideMarginMarkupPt,
  guideQuoteFromCablesPt,
} from './content/guides-pt.ts'
import { calculatorBodyEn, calculatorBodyPt } from './content/tool.ts'
import { SITE_ORIGIN, type PublicPage, absUrl, normalizePath } from './site.ts'

function articleLd(
  title: string,
  description: string,
  path: string,
  locale: 'pt' | 'en',
): Record<string, unknown> {
  return {
    '@type': 'Article',
    headline: title,
    description,
    inLanguage: locale === 'pt' ? 'pt-PT' : 'en',
    mainEntityOfPage: absUrl(path),
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
  }
}

function breadcrumbLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  }
}

export function getPublicPages(): PublicPage[] {
  const pages: PublicPage[] = [
    {
      path: '/',
      locale: 'pt',
      title: 'CableFlow — calculadora de cabos e orçamentos',
      description:
        'Software para eletricistas: metros de cabo por circuito, catálogo e orçamentos. Offline, sem registo. Margem e markup claros.',
      canonicalPath: '/',
      alternatePath: '/en/',
      ogImage: '/og/cableflow-pt.png',
      bodyHtml: landingBodyPt(),
      jsonLd: [faqJsonLd(faqPt)],
      kind: 'landing',
    },
    {
      path: '/en/',
      locale: 'en',
      title: 'CableFlow — cable calculator & quotes',
      description:
        'Software for electricians: cable metres per circuit, catalog and quotes. Offline, no sign-up. Clear margin and markup.',
      canonicalPath: '/en/',
      alternatePath: '/',
      ogImage: '/og/cableflow-en.png',
      bodyHtml: landingBodyEn(),
      jsonLd: [faqJsonLd(faqEn)],
      kind: 'landing',
    },
    {
      path: '/guias/metros-de-cabo-por-circuito/',
      locale: 'pt',
      title: 'Metros de cabo por circuito | CableFlow',
      description:
        'Como calcular metros de cabo por tubo: secções I/T/P/S/Q/G, specs FTN/2VJTN e fator ×2 do traveller VJ.',
      canonicalPath: '/guias/metros-de-cabo-por-circuito/',
      alternatePath: '/en/guides/cable-meters-per-circuit/',
      ogImage: '/og/cableflow-pt.png',
      bodyHtml: guideCableMetersPt(),
      breadcrumbs: [
        { name: 'Início', path: '/' },
        { name: 'Metros de cabo por circuito', path: '/guias/metros-de-cabo-por-circuito/' },
      ],
      jsonLd: [],
      kind: 'guide',
    },
    {
      path: '/en/guides/cable-meters-per-circuit/',
      locale: 'en',
      title: 'Cable metres per circuit | CableFlow',
      description:
        'Calculate cable metres per conduit: sections I/T/P/S/Q/G, FTN/2VJTN specs, and traveller VJ ×2 factor.',
      canonicalPath: '/en/guides/cable-meters-per-circuit/',
      alternatePath: '/guias/metros-de-cabo-por-circuito/',
      ogImage: '/og/cableflow-en.png',
      bodyHtml: guideCableMetersEn(),
      breadcrumbs: [
        { name: 'Home', path: '/en/' },
        { name: 'Cable metres per circuit', path: '/en/guides/cable-meters-per-circuit/' },
      ],
      jsonLd: [],
      kind: 'guide',
    },
    {
      path: '/guias/margem-vs-markup-orcamentos/',
      locale: 'pt',
      title: 'Margem vs markup em orçamentos | CableFlow',
      description:
        'Diferença entre margem e markup: com custo 100 €, margem 20% ou markup 25% dão venda 125 €. Exemplos para eletricistas.',
      canonicalPath: '/guias/margem-vs-markup-orcamentos/',
      alternatePath: '/en/guides/margin-vs-markup-quotes/',
      ogImage: '/og/cableflow-pt.png',
      bodyHtml: guideMarginMarkupPt(),
      breadcrumbs: [
        { name: 'Início', path: '/' },
        { name: 'Margem vs markup', path: '/guias/margem-vs-markup-orcamentos/' },
      ],
      jsonLd: [],
      kind: 'guide',
    },
    {
      path: '/en/guides/margin-vs-markup-quotes/',
      locale: 'en',
      title: 'Margin vs markup in quotes | CableFlow',
      description:
        'Margin vs markup explained: cost €100, 20% margin or 25% markup both yield €125 sale. For electrical quotes.',
      canonicalPath: '/en/guides/margin-vs-markup-quotes/',
      alternatePath: '/guias/margem-vs-markup-orcamentos/',
      ogImage: '/og/cableflow-en.png',
      bodyHtml: guideMarginMarkupEn(),
      breadcrumbs: [
        { name: 'Home', path: '/en/' },
        { name: 'Margin vs markup', path: '/en/guides/margin-vs-markup-quotes/' },
      ],
      jsonLd: [],
      kind: 'guide',
    },
    {
      path: '/guias/orcamento-instalacao-eletrica-lista-cabos/',
      locale: 'pt',
      title: 'Orçamento a partir da lista de cabos | CableFlow',
      description:
        'Do projeto de cabos ao orçamento: totais por secção × condutor, catálogo, margem e impressão sem custos internos.',
      canonicalPath: '/guias/orcamento-instalacao-eletrica-lista-cabos/',
      alternatePath: '/en/guides/electrical-quote-from-cable-list/',
      ogImage: '/og/cableflow-pt.png',
      bodyHtml: guideQuoteFromCablesPt(),
      breadcrumbs: [
        { name: 'Início', path: '/' },
        {
          name: 'Orçamento a partir da lista de cabos',
          path: '/guias/orcamento-instalacao-eletrica-lista-cabos/',
        },
      ],
      jsonLd: [],
      kind: 'guide',
    },
    {
      path: '/en/guides/electrical-quote-from-cable-list/',
      locale: 'en',
      title: 'Quote from a cable list | CableFlow',
      description:
        'From cable project to quote: section × conductor totals, catalog mapping, margin, and client print without internal costs.',
      canonicalPath: '/en/guides/electrical-quote-from-cable-list/',
      alternatePath: '/guias/orcamento-instalacao-eletrica-lista-cabos/',
      ogImage: '/og/cableflow-en.png',
      bodyHtml: guideQuoteFromCablesEn(),
      breadcrumbs: [
        { name: 'Home', path: '/en/' },
        {
          name: 'Quote from a cable list',
          path: '/en/guides/electrical-quote-from-cable-list/',
        },
      ],
      jsonLd: [],
      kind: 'guide',
    },
    {
      path: '/calculadora-margem-markup/',
      locale: 'pt',
      title: 'Calculadora margem e markup | CableFlow',
      description:
        'Calculadora gratuita de margem e markup (ex. 100 € → 125 €). Sem registo, sem gravar dados. Fórmulas do CableFlow.',
      canonicalPath: '/calculadora-margem-markup/',
      alternatePath: '/en/margin-markup-calculator/',
      ogImage: '/og/cableflow-pt.png',
      bodyHtml: calculatorBodyPt().replace(
        '<script type="module" src="/src/public-site/calculator-main.ts"></script>',
        '<script type="module" src="/seo/calculator.js"></script>',
      ),
      breadcrumbs: [
        { name: 'Início', path: '/' },
        { name: 'Calculadora', path: '/calculadora-margem-markup/' },
      ],
      jsonLd: [],
      kind: 'tool',
    },
    {
      path: '/en/margin-markup-calculator/',
      locale: 'en',
      title: 'Margin & markup calculator | CableFlow',
      description:
        'Free margin and markup calculator (e.g. €100 → €125). No sign-up, nothing stored. Same formulas as CableFlow.',
      canonicalPath: '/en/margin-markup-calculator/',
      alternatePath: '/calculadora-margem-markup/',
      ogImage: '/og/cableflow-en.png',
      bodyHtml: calculatorBodyEn().replace(
        '<script type="module" src="/src/public-site/calculator-main.ts"></script>',
        '<script type="module" src="/seo/calculator.js"></script>',
      ),
      breadcrumbs: [
        { name: 'Home', path: '/en/' },
        { name: 'Calculator', path: '/en/margin-markup-calculator/' },
      ],
      jsonLd: [],
      kind: 'tool',
    },
  ]

  for (const page of pages) {
    if (page.kind === 'guide' && page.breadcrumbs) {
      page.jsonLd = [
        breadcrumbLd(page.breadcrumbs),
        articleLd(page.title, page.description, page.canonicalPath, page.locale),
      ]
    }
    if (page.kind === 'tool' && page.breadcrumbs) {
      page.jsonLd = [breadcrumbLd(page.breadcrumbs)]
    }
    page.path = normalizePath(page.path)
  }

  return pages
}

export function notFoundPage(): PublicPage {
  return {
    path: '/404',
    locale: 'pt',
    title: 'Página não encontrada | CableFlow',
    description: 'A página pedida não existe. Volta ao início do CableFlow.',
    canonicalPath: '/',
    alternatePath: '/en/',
    ogImage: '/og/cableflow-pt.png',
    bodyHtml: `
<section class="hero">
  <h1>Página não encontrada</h1>
  <p class="lede">Este URL não faz parte do site público do CableFlow.</p>
  <p class="cta-row"><a class="btn btn-primary" href="/">Ir para o início</a> <a class="btn btn-ghost" href="/en/">English home</a></p>
</section>`,
    jsonLd: [],
    kind: '404',
  }
}
