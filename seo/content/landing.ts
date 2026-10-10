import { faqEn, faqPt, faqSectionHtml } from './faq.ts'

function cta(locale: 'pt' | 'en'): string {
  if (locale === 'pt') {
    return `<p class="cta-row"><a class="btn btn-primary" href="/dashboard">Abrir CableFlow</a> <a class="btn btn-ghost" href="/calculadora-margem-markup/">Calculadora margem/markup</a></p>`
  }
  return `<p class="cta-row"><a class="btn btn-primary" href="/dashboard">Open CableFlow</a> <a class="btn btn-ghost" href="/en/margin-markup-calculator/">Margin/markup calculator</a></p>`
}

export function landingBodyPt(): string {
  return `
<section class="hero">
  <p class="eyebrow">Software para eletricistas · offline · sem registo</p>
  <h1>Calculadora de cabos elétricos e orçamentos — no teu dispositivo</h1>
  <p class="lede">O CableFlow ajuda instaladores a medir tubos, calcular metros de cabo por circuito, gerir catálogo e montar orçamentos de instalação elétrica com margem e markup claros. Funciona offline; não precisas de conta.</p>
  ${cta('pt')}
</section>

<section class="section" aria-labelledby="what-h">
  <h2 id="what-h">O que faz</h2>
  <p>Fluxo completo: <strong>medir → calcular → catálogo → orçamento → imprimir</strong>.</p>
  <ol class="steps">
    <li><strong>Medir</strong> — registas corridas de cabo (um tubo por linha) com distância e especificação de condutores.</li>
    <li><strong>Calcular</strong> — a app obtém metros por secção × condutor, com secção automática por tipo de circuito (I/T/P/S/Q/G).</li>
    <li><strong>Catálogo</strong> — materiais e fornecedores com preços de compra e venda.</li>
    <li><strong>Orçamento</strong> — crias a partir do projeto (totais agregados) ou à mão; adicionas mão de obra e IVA.</li>
    <li><strong>Imprimir</strong> — vista profissional para o cliente, sem custos internos.</li>
  </ol>
</section>

<section class="section" aria-labelledby="how-h">
  <h2 id="how-h">Como funciona em 4 passos</h2>
  <ol class="steps numbered">
    <li>Cria um projeto e adiciona as corridas (zona, tipo, distância, spec tipo <code>FTN</code> ou <code>2VJTN</code>).</li>
    <li>Consulta o resumo em direto: metros de cabo por circuito e totais por secção × condutor.</li>
    <li>Gera um orçamento a partir do projeto e associa cada total a um material do catálogo.</li>
    <li>Ajusta margem ou markup, imprime para o cliente e exporta JSON como backup.</li>
  </ol>
  ${cta('pt')}
</section>

<section class="section" aria-labelledby="feat-h">
  <h2 id="feat-h">Funcionalidades reais</h2>
  <ul class="feature-list">
    <li>Parser de specs <code>FTN</code>, <code>F2R</code>, <code>2VJTN</code>, <code>4VJ</code>, <code>3F2N</code>, <code>FRTN</code>, <code>C</code> (e gramática documentada na app).</li>
    <li>Secção automática por tipo I / T / P / S / Q / G (1,5 a 16 mm²).</li>
    <li>Resumo por secção × condutor; o traveller VJ conta metros com fator ×2.</li>
    <li>Orçamento a partir do projeto com importação agregada (não por divisão/etiqueta de circuito).</li>
    <li>Custo de compra e preço de venda separados; cálculos de margem e markup.</li>
    <li>Vista de impressão para o cliente sem custos internos; vista interna de rentabilidade.</li>
    <li>Interface em português e inglês; modo claro / escuro.</li>
    <li>Offline-first; sincronização opcional com código secreto; exportação JSON.</li>
  </ul>
</section>

<section class="section" aria-labelledby="priv-h">
  <h2 id="priv-h">Privacidade</h2>
  <p>Sem contas. Os dados ficam no teu dispositivo. A sincronização na nuvem é opcional e usa um código secreto UUID — quem tiver o código vê o espaço; não há diretório público de códigos. Exporta JSON como backup independente.</p>
</section>

<section class="section" aria-labelledby="guides-h">
  <h2 id="guides-h">Guias e ferramenta gratuita</h2>
  <ul class="link-cards">
    <li><a href="/guias/metros-de-cabo-por-circuito/"><strong>Metros de cabo por circuito</strong></a> — secções, specs e fator VJ.</li>
    <li><a href="/guias/margem-vs-markup-orcamentos/"><strong>Margem vs markup</strong></a> — o exemplo 100 € → 125 €.</li>
    <li><a href="/guias/orcamento-instalacao-eletrica-lista-cabos/"><strong>Orçamento a partir da lista de cabos</strong></a>.</li>
    <li><a href="/calculadora-margem-markup/"><strong>Calculadora margem/markup</strong></a> — sem login nem gravação.</li>
  </ul>
</section>

${faqSectionHtml(faqPt, 'pt')}
`
}

export function landingBodyEn(): string {
  return `
<section class="hero">
  <p class="eyebrow">Software for electricians · offline · no sign-up</p>
  <h1>Electrical cable calculator and quotes — on your device</h1>
  <p class="lede">CableFlow helps installers measure conduit runs, calculate cable metres per circuit, manage a catalog, and build electrical installation quotes with clear margin and markup. It works offline; no account required.</p>
  ${cta('en')}
</section>

<section class="section" aria-labelledby="what-h">
  <h2 id="what-h">What it does</h2>
  <p>Full flow: <strong>measure → calculate → catalog → quote → print</strong>.</p>
  <ol class="steps">
    <li><strong>Measure</strong> — log cable runs (one conduit per row) with distance and conductor specs.</li>
    <li><strong>Calculate</strong> — metres by section × conductor, with automatic section from circuit type (I/T/P/S/Q/G).</li>
    <li><strong>Catalog</strong> — materials and suppliers with purchase and sale prices.</li>
    <li><strong>Quote</strong> — create from the project (aggregated totals) or manually; add labour and VAT.</li>
    <li><strong>Print</strong> — professional client layout without internal costs.</li>
  </ol>
</section>

<section class="section" aria-labelledby="how-h">
  <h2 id="how-h">How it works in 4 steps</h2>
  <ol class="steps numbered">
    <li>Create a project and add runs (zone, type, distance, spec such as <code>FTN</code> or <code>2VJTN</code>).</li>
    <li>Read the live summary: cable metres per circuit and totals by section × conductor.</li>
    <li>Generate a quote from the project and map each total to a catalog material.</li>
    <li>Tune margin or markup, print for the client, and export JSON as backup.</li>
  </ol>
  ${cta('en')}
</section>

<section class="section" aria-labelledby="feat-h">
  <h2 id="feat-h">Real features</h2>
  <ul class="feature-list">
    <li>Spec parser for <code>FTN</code>, <code>F2R</code>, <code>2VJTN</code>, <code>4VJ</code>, <code>3F2N</code>, <code>FRTN</code>, <code>C</code>.</li>
    <li>Automatic section by type I / T / P / S / Q / G (1.5 to 16 mm²).</li>
    <li>Summary by section × conductor; traveller VJ metres use factor ×2.</li>
    <li>Quote from project with aggregated import (not per room/circuit label).</li>
    <li>Separate purchase cost and sale price; margin and markup calculations.</li>
    <li>Client print view without internal costs; internal profitability view.</li>
    <li>English / Portuguese UI; light / dark mode.</li>
    <li>Offline-first; optional sync with a secret code; JSON export.</li>
  </ul>
</section>

<section class="section" aria-labelledby="priv-h">
  <h2 id="priv-h">Privacy</h2>
  <p>No accounts. Data stays on your device. Optional cloud sync uses a secret UUID — anyone with the code can open the space; there is no public directory of codes. Export JSON as an independent backup.</p>
</section>

<section class="section" aria-labelledby="guides-h">
  <h2 id="guides-h">Guides and free tool</h2>
  <ul class="link-cards">
    <li><a href="/en/guides/cable-meters-per-circuit/"><strong>Cable metres per circuit</strong></a> — sections, specs, and VJ factor.</li>
    <li><a href="/en/guides/margin-vs-markup-quotes/"><strong>Margin vs markup</strong></a> — the €100 → €125 example.</li>
    <li><a href="/en/guides/electrical-quote-from-cable-list/"><strong>Quote from a cable list</strong></a>.</li>
    <li><a href="/en/margin-markup-calculator/"><strong>Margin/markup calculator</strong></a> — no login, nothing stored.</li>
  </ul>
</section>

${faqSectionHtml(faqEn, 'en')}
`
}
