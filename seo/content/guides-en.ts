/** Guide bodies in English (~600–1000 words each). */

export function guideCableMetersEn(): string {
  return `
<article class="prose">
  <h1>How to calculate cable metres per circuit and conduit</h1>
  <p class="lede">On site, the costly mistake is not the price per metre — it is under-ordering because you counted conduit length instead of conductors, or forgot the traveller. This guide explains how CableFlow turns each run into cable metres by section and conductor type.</p>

  <h2>What a “run” means in an electrical cable calculator</h2>
  <p>Each project row is one conduit (or path) with zone/description, circuit type, measured distance, and a conductor specification (“spec”). Distance is the path length in the conduit. Cable metres come from that distance and the spec composition — they are not the same as conduit metres when multiple conductors are present or when the traveller is doubled.</p>
  <p>That gives installers a reliable purchase list: metres of brown phase at 2.5 mm², blue neutral, grey traveller (VJ), and so on, aggregated across the project.</p>

  <h2>Automatic section by circuit type (I / T / P / S / Q / G)</h2>
  <p>In CableFlow you do not pick mm² manually in the cable table. You pick a <strong>circuit type</strong>, and the app maps the section used in summaries:</p>
  <table>
    <thead><tr><th>Type</th><th>Typical use in the app</th><th>Section</th></tr></thead>
    <tbody>
      <tr><td>I</td><td>Lighting</td><td>1.5 mm²</td></tr>
      <tr><td>T</td><td>Sockets</td><td>2.5 mm²</td></tr>
      <tr><td>P</td><td>Power</td><td>4 mm²</td></tr>
      <tr><td>S</td><td>Power 6 mm²</td><td>6 mm²</td></tr>
      <tr><td>Q</td><td>Large power</td><td>10 mm²</td></tr>
      <tr><td>G</td><td>Main feed</td><td>16 mm²</td></tr>
    </tbody>
  </table>
  <p>These values are the app’s internal table (see also <code>FACTS_TO_VERIFY.md</code>). On a real job, always confirm the section required by the electrical design and applicable rules — the calculator organises metres; it does not replace the design.</p>

  <h2>Conductor specs: FTN, F2R, 2VJTN and friends</h2>
  <p>Spec grammar is a sequence of <code>[quantity?][code]</code>. Quantity defaults to 1. Codes: F, R, VJ, N, T, C (longest match first so VJ is not read as V+J).</p>
  <ul>
    <li><code>FTN</code> → 1×F, 1×T, 1×N</li>
    <li><code>F2R</code> → 1×F, 2×R</li>
    <li><code>2VJTN</code> → 2×VJ, 1×T, 1×N</li>
    <li><code>C</code> → 3-core multifilar cable (counts as 3 conductors for conduit fill; sold/measured as cable metres, not ×3)</li>
  </ul>
  <p>UI colour swatches help review: F brown, R orange, VJ grey, N blue, T green/yellow, C black — an app convention, not a claim of mandatory colour mapping in every region.</p>

  <h2>The metres formula (and VJ ×2)</h2>
  <p>For each conductor in the spec:</p>
  <p><strong>metres = quantity × run distance × factor</strong></p>
  <p>Factor is 1 for most codes. <strong>VJ (traveller)</strong> always uses <strong>×2</strong>: on an 8 m run with <code>2VJTN</code>, VJ metres are 2 × 8 × 2 = 32 m, while T and N are 8 m each. That avoids the classic shortage of grey on two-way switching.</p>
  <p>The project summary aggregates metres by <strong>section × conductor code</strong>. That aggregation later feeds the quote (purchase totals, not room labels).</p>

  <h2>Worked example</h2>
  <p>Zone “Hall”, type T (2.5 mm²), distance 12 m, spec <code>FTN</code>: F = 12 m, T = 12 m, N = 12 m — 36 m of cable for 12 m of conduit. A lighting run with <code>2VJ</code> at 10 m (type I, 1.5 mm²) yields VJ = 40 m at 1.5 mm². The summary keeps sections separate for correct purchasing.</p>

  <h2>On-site habits</h2>
  <ul>
    <li>Measure the real conduit path, not only plan distance.</li>
    <li>Keep zone naming consistent for review.</li>
    <li>Double-check VJ specs for the ×2 factor before ordering.</li>
    <li>When the list is stable, create the quote from the project instead of retyping metres.</li>
  </ul>

  <h2>Next</h2>
  <p>Continue with <a href="/en/guides/electrical-quote-from-cable-list/">quoting from a cable list</a>, <a href="/en/guides/margin-vs-markup-quotes/">margin vs markup</a>, or the free <a href="/en/margin-markup-calculator/">calculator</a>.</p>
  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Open CableFlow</a></p>
</article>`
}

export function guideMarginMarkupEn(): string {
  return `
<article class="prose">
  <h1>Margin vs markup in electrical quotes</h1>
  <p class="lede">Two installers say “I want 20%” and land on different sale prices. One means margin; the other markup. CableFlow keeps purchase cost and sale price separate — this guide locks the difference with the classic example: cost €100 → sale €125.</p>

  <h2>Plain definitions</h2>
  <p><strong>Markup</strong> is profit as a percentage of <em>cost</em>. Cost €100 with 25% markup → sale = 100 × (1 + 0.25) = <strong>€125</strong>.</p>
  <p><strong>Margin</strong> is profit as a percentage of <em>sale price</em>. For 20% margin on €100 cost, sale = 100 / (1 − 0.20) = <strong>€125</strong>.</p>
  <p>The same sale (€125) is 25% markup or 20% margin. Saying “20%” without naming the method is ambiguous — and it changes real profitability on an electrical installation quote.</p>

  <h2>Formulas (same as the app)</h2>
  <ul>
    <li>Sale from margin: <code>sale = cost / (1 − margin%/100)</code></li>
    <li>Sale from markup: <code>sale = cost × (1 + markup%/100)</code></li>
    <li>Observed margin: <code>(sale − cost) / sale × 100</code></li>
    <li>Observed markup: <code>(sale − cost) / cost × 100</code></li>
  </ul>
  <p>At cost €100 and sale €125: profit €25, margin 20%, markup 25%. At the same nominal percentage, margin implies a higher sale than markup (20% margin ≠ 20% markup).</p>

  <h2>Why it matters</h2>
  <p>If cable price rises and you “keep 20%” without clarifying the method, you may squeeze real margin or overcharge unintentionally. Software for electricians that shows cost, sale, margin %, and markup % side by side prevents that mix-up — CableFlow’s internal profitability view does this.</p>
  <p>The client print view does not show internal costs.</p>

  <h2>Example on a cable line</h2>
  <p>200 m at €1.20/m purchase → line cost €240. With 20% margin: sale = 240 / 0.8 = €300. With 20% markup: sale = 240 × 1.2 = €288. A €12 gap on one line adds up on larger jobs.</p>
  <p>The public <a href="/en/margin-markup-calculator/">margin/markup calculator</a> reuses the same pricing functions, with no login and no data stored.</p>

  <h2>Habits</h2>
  <ul>
    <li>Agree whether commercial targets are margin or markup.</li>
    <li>Keep purchase and sale separate in the catalog.</li>
    <li>Review internal profitability before printing; print the client view only.</li>
    <li>Use consistent percentage methods across materials and labour.</li>
  </ul>

  <h2>In the CableFlow flow</h2>
  <p>After <a href="/en/guides/cable-meters-per-circuit/">cable metres per circuit</a>, import totals into a quote and apply margin/markup. See also <a href="/en/guides/electrical-quote-from-cable-list/">quoting from a cable list</a>.</p>
  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Open CableFlow</a> <a class="btn btn-ghost" href="/en/margin-markup-calculator/">Open calculator</a></p>
</article>`
}

export function guideQuoteFromCablesEn(): string {
  return `
<article class="prose">
  <h1>How to build an electrical installation quote from a cable list</h1>
  <p class="lede">Moving from measured conduit runs to a clear quote is where projects lose time (and margin). This guide follows CableFlow’s real flow: cable project → totals by section × conductor → quote → client print — without inventing features the app does not have.</p>

  <h2>Why aggregate by section × conductor</h2>
  <p>On site you think in circuits and zones. For buying and quoting cable, what matters is metres per section and conductor type. When creating a quote from a project, CableFlow imports lengths <strong>aggregated by section × conductor</strong> (e.g. total F @ 2.5 mm²), not one line per room label. That matches reels and catalog pricing.</p>

  <h2>Step 1 — Solid cable project</h2>
  <p>Create the project and fill runs: zone, type I/T/P/S/Q/G (automatic section), distance, and spec. Check the live summary. Fix VJ and specs before quoting — fixing later means updating quantities.</p>

  <h2>Step 2 — Material catalog</h2>
  <p>Define materials with purchase and sale prices, unit (including metre), category, and supplier. The closer the catalog is to what you buy, the faster you map cable totals. Catalogs import/export as JSON.</p>

  <h2>Step 3 — Quote from project</h2>
  <p>From the project, create a quote. Map each section × conductor total to a catalog material. Add other materials, custom lines, and labour (hour / day / unit / fixed). VAT, discount, and global margin are configurable.</p>
  <p>If cable lengths change later, the quote editor can detect differences and <strong>update quantities</strong> from the linked project.</p>

  <h2>Step 4 — Margin, markup, internal view</h2>
  <p>Keep cost and sale separate. Use margin or markup deliberately (see <a href="/en/guides/margin-vs-markup-quotes/">margin vs markup</a>). Internal view shows profitability; client print omits internal costs.</p>

  <h2>Step 5 — Print and archive</h2>
  <p>Print the professional client layout. Export the quote or a full JSON backup if you need an archive independent of optional sync. Automatic numbering such as ORC-YYYY-NNN is available in the app.</p>

  <h2>Quick checklist</h2>
  <ol>
    <li>Metres and specs reviewed (especially VJ ×2).</li>
    <li>Catalog purchase/sale prices current.</li>
    <li>Quote created from project; materials mapped.</li>
    <li>Labour and VAT set.</li>
    <li>Internal profitability OK; client print without internal costs.</li>
    <li>JSON backup if sharing a snapshot without sharing the workspace UUID.</li>
  </ol>

  <h2>Privacy in this flow</h2>
  <p>No accounts; data on your device. Optional sync with a secret code; JSON export as backup. That fits offline work on site.</p>

  <p>For the metres math, read <a href="/en/guides/cable-meters-per-circuit/">cable metres per circuit</a>. For pricing without opening the full app, use the <a href="/en/margin-markup-calculator/">margin/markup calculator</a>.</p>
  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Open CableFlow</a></p>
</article>`
}
