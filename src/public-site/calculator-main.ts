import {
  calculateMargin,
  calculateMarginPrice,
  calculateMarkup,
  calculateMarkupPrice,
} from '@/utils/pricing'

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
  }).format(n)
}

function render(): void {
  const form = document.getElementById('mm-form') as HTMLFormElement | null
  const result = document.getElementById('mm-result')
  if (!form || !result) return

  const run = () => {
    const cost = Number((form.elements.namedItem('cost') as HTMLInputElement).value)
    const percent = Number((form.elements.namedItem('percent') as HTMLInputElement).value)
    const mode = (form.querySelector('input[name="mode"]:checked') as HTMLInputElement | null)
      ?.value
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(percent) || percent < 0) {
      result.innerHTML = '<p>Introduz valores numéricos válidos.</p>'
      return
    }

    if (mode === 'markup') {
      const sale = calculateMarkupPrice(cost, percent)
      const margin = calculateMargin(sale, cost)
      result.innerHTML = `<p>Custo <strong>${money(cost)}</strong> · markup <strong>${percent}%</strong> → venda <strong>${money(sale)}</strong> (margem equivalente <strong>${margin}%</strong>).</p>`
      return
    }

    if (percent >= 100) {
      result.innerHTML = '<p>A margem deve ser inferior a 100%.</p>'
      return
    }

    const sale = calculateMarginPrice(cost, percent)
    const markup = calculateMarkup(sale, cost)
    result.innerHTML = `<p>Custo <strong>${money(cost)}</strong> · margem <strong>${percent}%</strong> → venda <strong>${money(sale)}</strong> (markup equivalente <strong>${markup}%</strong>).</p>`
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    run()
  })
  form.addEventListener('input', run)
  run()
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render)
  } else {
    render()
  }
}
