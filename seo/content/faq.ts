export interface FaqItem {
  q: string
  a: string
}

export const faqPt: FaqItem[] = [
  {
    q: 'O CableFlow precisa de registo ou conta?',
    a: 'Não. Não há login nem email. Os dados ficam no teu dispositivo (localStorage). A sincronização na nuvem é opcional e usa um código secreto UUID.',
  },
  {
    q: 'Funciona offline?',
    a: 'Sim. A aplicação é uma SPA que corre no browser e guarda projetos, materiais e orçamentos localmente. Se a rede falhar, continues a trabalhar; a sincronização opcional retoma quando voltares online.',
  },
  {
    q: 'Como se calculam os metros de cabo?',
    a: 'Por cada tubo/corrida defines a distância e a especificação de condutores (ex.: FTN, 2VJTN). Os metros de cada condutor são quantidade × distância × fator. O traveller VJ usa sempre fator ×2; os outros códigos ×1.',
  },
  {
    q: 'O que significam os tipos I, T, P, S, Q e G?',
    a: 'São tipos de circuito que a app mapeia automaticamente para secção de cabo: I 1,5 mm², T 2,5 mm², P 4 mm², S 6 mm², Q 10 mm², G 16 mm². Não escolhes a secção à mão na vista de cabos.',
  },
  {
    q: 'Qual a diferença entre margem e markup no orçamento?',
    a: 'Margem é lucro sobre o preço de venda; markup é lucro sobre o custo. Com custo 100 €, margem 20% dá venda 125 €; markup 25% também dá 125 € — percentagens iguais não significam o mesmo preço.',
  },
  {
    q: 'A vista de impressão mostra os meus custos internos?',
    a: 'Não. A impressão profissional é orientada ao cliente e não inclui custos internos, margem interna nem markup. Esses valores ficam na vista interna de rentabilidade.',
  },
  {
    q: 'Como abro o mesmo espaço noutro dispositivo?',
    a: 'Se a sincronização estiver configurada, em Definições vês o código do espaço (UUID). Noutro dispositivo: Definições → Abrir outro espaço e colas o código. Trata-o como palavra-passe.',
  },
  {
    q: 'Posso exportar um backup?',
    a: 'Sim. Em Definições podes exportar/importar JSON completo (projetos, materiais, fornecedores, orçamentos). Continua a ser a forma independente de backup além da sincronização opcional.',
  },
]

export const faqEn: FaqItem[] = [
  {
    q: 'Does CableFlow require an account?',
    a: 'No. There is no login or email. Data stays on your device (localStorage). Optional cloud sync uses a secret UUID workspace code.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. The app runs in the browser and stores projects, materials, and quotes locally. If the network drops, you keep working; optional sync resumes when you are back online.',
  },
  {
    q: 'How are cable metres calculated?',
    a: 'For each conduit run you set distance and a conductor spec (e.g. FTN, 2VJTN). Metres per conductor are quantity × distance × factor. Traveller VJ always uses ×2; other codes use ×1.',
  },
  {
    q: 'What do circuit types I, T, P, S, Q, and G mean?',
    a: 'They map automatically to cable sections: I 1.5 mm², T 2.5 mm², P 4 mm², S 6 mm², Q 10 mm², G 16 mm². You do not pick section manually in the cable view.',
  },
  {
    q: 'What is the difference between margin and markup?',
    a: 'Margin is profit over sale price; markup is profit over cost. With cost €100, 20% margin → €125 sale; 25% markup → €125 sale — the same percentage is not the same method.',
  },
  {
    q: 'Does the print view show internal costs?',
    a: 'No. The client-facing print layout omits internal costs, margin, and markup. Those stay in the internal profitability view.',
  },
  {
    q: 'How do I open the same workspace on another device?',
    a: 'When sync is configured, Settings shows your workspace UUID. On another device: Settings → Open another workspace and paste the code. Treat it like a password.',
  },
  {
    q: 'Can I export a backup?',
    a: 'Yes. Settings lets you export/import full JSON (projects, materials, suppliers, quotes). It remains an independent backup besides optional sync.',
  },
]

export function faqSectionHtml(items: FaqItem[], locale: 'pt' | 'en'): string {
  const title = locale === 'pt' ? 'Perguntas frequentes' : 'Frequently asked questions'
  const dts = items
    .map(
      (item) => `
<details class="faq-item">
  <summary>${escapeHtml(item.q)}</summary>
  <p>${escapeHtml(item.a)}</p>
</details>`,
    )
    .join('')
  return `<section class="section" id="faq" aria-labelledby="faq-h"><h2 id="faq-h">${title}</h2>${dts}</section>`
}

export function faqJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
