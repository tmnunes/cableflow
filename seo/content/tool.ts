export function calculatorBodyPt(): string {
  return `
<article class="prose tool">
  <h1>Calculadora de margem e markup</h1>
  <p class="lede">Ferramenta pública gratuita: converte custo em preço de venda com margem ou markup, usando as mesmas fórmulas do CableFlow. Sem login e sem gravar dados no servidor.</p>

  <form id="mm-form" class="calc-form" novalidate>
    <div class="field">
      <label for="cost">Custo (€)</label>
      <input id="cost" name="cost" type="number" inputmode="decimal" min="0" step="0.01" value="100" required />
    </div>
    <fieldset>
      <legend>Método</legend>
      <label class="radio"><input type="radio" name="mode" value="margin" checked /> Margem %</label>
      <label class="radio"><input type="radio" name="mode" value="markup" /> Markup %</label>
    </fieldset>
    <div class="field">
      <label for="percent">Percentagem</label>
      <input id="percent" name="percent" type="number" inputmode="decimal" min="0" max="99.99" step="0.1" value="20" required />
    </div>
    <button type="submit" class="btn btn-primary">Calcular</button>
  </form>

  <div id="mm-result" class="calc-result" role="status" aria-live="polite">
    <p>Com custo <strong>100 €</strong> e margem <strong>20%</strong>, venda = <strong>125 €</strong> (markup equivalente 25%).</p>
  </div>

  <section class="section" aria-labelledby="how-calc">
    <h2 id="how-calc">Como interpretar</h2>
    <p>Margem 20% sobre 100 € → venda 125 €. Markup 25% sobre 100 € → também 125 €. Percentagens iguais não são o mesmo método — detalhe no <a href="/guias/margem-vs-markup-orcamentos/">guia margem vs markup</a>.</p>
    <p>Os cálculos correm só no teu browser (módulo de pricing da app). Nada é enviado para o servidor.</p>
  </section>

  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Abrir CableFlow</a> <a class="btn btn-ghost" href="/">Voltar ao início</a></p>
</article>
<script type="module" src="/src/public-site/calculator-main.ts"></script>
`
}

export function calculatorBodyEn(): string {
  return `
<article class="prose tool">
  <h1>Margin and markup calculator</h1>
  <p class="lede">Free public tool: turn cost into sale price with margin or markup, using the same CableFlow formulas. No login and nothing stored on the server.</p>

  <form id="mm-form" class="calc-form" novalidate>
    <div class="field">
      <label for="cost">Cost (€)</label>
      <input id="cost" name="cost" type="number" inputmode="decimal" min="0" step="0.01" value="100" required />
    </div>
    <fieldset>
      <legend>Method</legend>
      <label class="radio"><input type="radio" name="mode" value="margin" checked /> Margin %</label>
      <label class="radio"><input type="radio" name="mode" value="markup" /> Markup %</label>
    </fieldset>
    <div class="field">
      <label for="percent">Percentage</label>
      <input id="percent" name="percent" type="number" inputmode="decimal" min="0" max="99.99" step="0.1" value="20" required />
    </div>
    <button type="submit" class="btn btn-primary">Calculate</button>
  </form>

  <div id="mm-result" class="calc-result" role="status" aria-live="polite">
    <p>With cost <strong>€100</strong> and margin <strong>20%</strong>, sale = <strong>€125</strong> (equivalent markup 25%).</p>
  </div>

  <section class="section" aria-labelledby="how-calc">
    <h2 id="how-calc">How to read it</h2>
    <p>20% margin on €100 → sale €125. 25% markup on €100 → also €125. Equal percentages are not the same method — see the <a href="/en/guides/margin-vs-markup-quotes/">margin vs markup guide</a>.</p>
    <p>Calculations run only in your browser (app pricing module). Nothing is sent to the server.</p>
  </section>

  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Open CableFlow</a> <a class="btn btn-ghost" href="/en/">Back home</a></p>
</article>
<script type="module" src="/src/public-site/calculator-main.ts"></script>
`
}
