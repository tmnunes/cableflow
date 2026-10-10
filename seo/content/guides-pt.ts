/** Guide bodies in European Portuguese (~600–1000 words each). */

export function guideCableMetersPt(): string {
  return `
<article class="prose">
  <h1>Como calcular os metros de cabo por circuito e por tubo</h1>
  <p class="lede">Em obra, o erro mais caro no material de cabo não é o preço do metro — é subestimar metros porque se conta o tubo em vez do condutor, ou se esquece o traveller. Este guia explica a lógica que o CableFlow usa para transformar cada corrida (tubo) em metros de cabo por secção e por tipo de condutor.</p>

  <h2>O que é uma «corrida» na calculadora de cabos elétricos</h2>
  <p>Cada linha do projeto representa um tubo (ou percurso) com: descrição/zona, tipo de circuito, distância medida e uma especificação de condutores (a «spec»). A distância é o comprimento do percurso no tubo. Os metros de cabo são derivados dessa distância e da composição da spec — não são iguais ao metro de tubo quando há vários condutores ou quando o traveller conta a dobrar.</p>
  <p>Isto serve instaladores que precisam de uma lista de compra fiável: quantos metros de fase castanha a 2,5 mm², quantos de azul, quantos de cinza (VJ), etc., agregados em todo o projeto.</p>

  <h2>Secção automática por tipo de circuito (I / T / P / S / Q / G)</h2>
  <p>No CableFlow não escolhes a secção mm² à mão na tabela de cabos. Escolhes o <strong>tipo de circuito</strong>, e a app associa a secção usada no resumo:</p>
  <table>
    <thead><tr><th>Tipo</th><th>Uso típico na app</th><th>Secção</th></tr></thead>
    <tbody>
      <tr><td>I</td><td>Iluminação</td><td>1,5 mm²</td></tr>
      <tr><td>T</td><td>Tomadas</td><td>2,5 mm²</td></tr>
      <tr><td>P</td><td>Força</td><td>4 mm²</td></tr>
      <tr><td>S</td><td>Força 6 mm²</td><td>6 mm²</td></tr>
      <tr><td>Q</td><td>Grande potência</td><td>10 mm²</td></tr>
      <tr><td>G</td><td>Alimentação principal</td><td>16 mm²</td></tr>
    </tbody>
  </table>
  <p>Estes valores são a tabela interna da aplicação (ver também <code>FACTS_TO_VERIFY.md</code>). Em projeto real confirma sempre a secção exigida pelo projeto elétrico e pelas regras aplicáveis à instalação — a calculadora organiza metros; não substitui o projeto de especialidade.</p>

  <h2>Specs de condutores: FTN, F2R, 2VJTN e afins</h2>
  <p>A gramática da spec é uma sequência de <code>[quantidade?][código]</code>. A quantidade omite-se e assume 1. Códigos: F, R, VJ, N, T, C (o match é pelo código mais longo primeiro, para VJ não ser lido como V+J).</p>
  <ul>
    <li><code>FTN</code> → 1×F, 1×T, 1×N</li>
    <li><code>F2R</code> → 1×F, 2×R</li>
    <li><code>2VJTN</code> → 2×VJ, 1×T, 1×N</li>
    <li><code>C</code> → cabo multifilar de 3 núcleos (conta como 3 condutores para encaixe no tubo; em metros de cabo vende-se como metros de cabo, não ×3)</li>
  </ul>
  <p>Na interface, as cores ajudam a rever a lista: F castanho, R laranja, VJ cinza, N azul, T verde/amarelo, C preto — convenção visual da app, não uma afirmação normativa de mapeamento obrigatório em todas as regiões.</p>

  <h2>A fórmula dos metros (e o fator ×2 do VJ)</h2>
  <p>Para cada condutor na spec:</p>
  <p><strong>metros = quantidade × distância do tubo × fator</strong></p>
  <p>O fator é 1 para a maioria dos códigos. O <strong>VJ (traveller)</strong> usa sempre fator <strong>×2</strong>: num tubo de 8 m com <code>2VJTN</code>, os metros de VJ são 2 × 8 × 2 = 32 m, enquanto T e N são 1 × 8 × 1 = 8 m cada. Este detalhe evita a clássica falta de cinza em comutação de escadas e pontos com traveller.</p>
  <p>O resumo do projeto agrega estes metros por <strong>secção × código de condutor</strong>. É essa agregação que depois alimenta o orçamento (totais de compra, não etiquetas por divisão).</p>

  <h2>Exemplo prático</h2>
  <p>Zona «Corredor», tipo T (2,5 mm²), distância 12 m, spec <code>FTN</code>: F = 12 m, T = 12 m, N = 12 m — total de cabo 36 m para 12 m de tubo. Se no mesmo projeto tiveres um ponto com <code>2VJ</code> a 10 m em tipo I (1,5 mm²), VJ = 2 × 10 × 2 = 40 m a 1,5 mm². O resumo separa 2,5 mm² e 1,5 mm² para compra correta.</p>

  <h2>Boas práticas em obra</h2>
  <ul>
    <li>Mede o percurso real do tubo (incluindo desvios), não só a distância em planta.</li>
    <li>Usa a mesma convenção de zona/descrição para filtrar e rever.</li>
    <li>Revê specs com VJ com atenção ao ×2 antes de encomendar.</li>
    <li>Quando a lista estabilizar, gera o orçamento a partir do projeto para não recopiar metros à mão.</li>
  </ul>

  <h2>Seguinte passo</h2>
  <p>Com os metros claros, o passo natural é o <a href="/guias/orcamento-instalacao-eletrica-lista-cabos/">orçamento de instalação elétrica a partir da lista de cabos</a> e, para preços, a <a href="/guias/margem-vs-markup-orcamentos/">diferença entre margem e markup</a> ou a <a href="/calculadora-margem-markup/">calculadora gratuita</a>.</p>
  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Abrir CableFlow</a></p>
</article>`
}

export function guideMarginMarkupPt(): string {
  return `
<article class="prose">
  <h1>Margem vs markup em orçamentos elétricos</h1>
  <p class="lede">Dois instaladores dizem «quero 20%» e chegam a preços de venda diferentes. Um fala de margem; o outro de markup. No CableFlow o custo de compra e o preço de venda estão separados, e as fórmulas não se confundem — este guia fixa a diferença com o exemplo clássico: custo 100 € → venda 125 €.</p>

  <h2>Definições sem jargão inútil</h2>
  <p><strong>Markup</strong> é o lucro expresso em percentagem do <em>custo</em>. Se o material te custa 100 € e aplicas markup de 25%, o preço de venda é 100 × (1 + 0,25) = <strong>125 €</strong>.</p>
  <p><strong>Margem</strong> é o lucro expresso em percentagem do <em>preço de venda</em>. Para obter 20% de margem sobre um custo de 100 €, a venda é 100 / (1 − 0,20) = <strong>125 €</strong>.</p>
  <p>O mesmo preço de venda (125 €) corresponde a markup 25% ou margem 20%. Por isso, «quero 20%» sem dizer se é margem ou markup é ambíguo — e em orçamentos de instalação elétrica isso muda a rentabilidade real.</p>

  <h2>Fórmulas (as mesmas da app)</h2>
  <ul>
    <li>Preço por margem: <code>venda = custo / (1 − margem%/100)</code></li>
    <li>Preço por markup: <code>venda = custo × (1 + markup%/100)</code></li>
    <li>Margem observada: <code>(venda − custo) / venda × 100</code></li>
    <li>Markup observado: <code>(venda − custo) / custo × 100</code></li>
  </ul>
  <p>Com custo 100 € e venda 125 €: lucro 25 €, margem 20%, markup 25%. À mesma percentagem nominal, a margem exige um preço de venda mais alto do que o markup (20% margem ≠ 20% markup).</p>

  <h2>Porque isto importa no dia a dia</h2>
  <p>Se o teu fornecedor sobe o metro de cabo e tu «manténs 20%» sem clarificar o método, podes estar a comprimir a margem real ou a inflacionar o preço ao cliente sem intenção. Em software para eletricistas, mostrar custo, venda, margem % e markup % lado a lado evita essa confusão — é o que a vista interna de rentabilidade do CableFlow faz.</p>
  <p>Na vista de impressão para o cliente, os custos internos não aparecem: o cliente vê o orçamento profissional, não a tua margem.</p>

  <h2>Exemplo num orçamento de cabos</h2>
  <p>Imagina 200 m de cabo a custo 1,20 €/m → custo linha 240 €. Com margem 20%: venda = 240 / 0,8 = 300 €. Com markup 20%: venda = 240 × 1,2 = 288 €. Dez euros de diferença numa só linha; em projetos grandes acumula.</p>
  <p>O CableFlow deixa-te trabalhar com margem global e com preços por linha. A ferramenta pública <a href="/calculadora-margem-markup/">calculadora de margem e markup</a> reutiliza as mesmas funções de pricing da app, sem login e sem guardar dados.</p>

  <h2>Boas práticas</h2>
  <ul>
    <li>Acorda com a equipa se os alvos comerciais são margem ou markup.</li>
    <li>Separa sempre custo de compra e preço de venda no catálogo.</li>
    <li>Revê a rentabilidade interna antes de imprimir; imprime só a vista de cliente.</li>
    <li>Usa percentagens consistentes em materiais e mão de obra para não misturar critérios.</li>
  </ul>

  <h2>Ligado ao fluxo CableFlow</h2>
  <p>Depois de calculares <a href="/guias/metros-de-cabo-por-circuito/">metros de cabo por circuito</a>, importas totais no orçamento e aplicas margem/markup. O guia <a href="/guias/orcamento-instalacao-eletrica-lista-cabos/">orçamento a partir da lista de cabos</a> fecha o ciclo.</p>
  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Abrir CableFlow</a> <a class="btn btn-ghost" href="/calculadora-margem-markup/">Abrir calculadora</a></p>
</article>`
}

export function guideQuoteFromCablesPt(): string {
  return `
<article class="prose">
  <h1>Como fazer um orçamento de instalação elétrica a partir da lista de cabos</h1>
  <p class="lede">Passar de uma lista de tubos medida em obra para um orçamento claro é onde muitos projetos perdem tempo (e margem). Este guia descreve o fluxo do CableFlow: projeto de cabos → totais por secção × condutor → orçamento → impressão ao cliente — sem inventar funcionalidades que a app não tem.</p>

  <h2>Porque agregar por secção × condutor</h2>
  <p>Em obra pensas em circuitos e zonas («Q1.1 cozinha», «iluminação hall»). Para comprar e orçamentar cabo, o que importa é: quantos metros de cada secção e de cada tipo de condutor. O CableFlow, ao criar orçamento a partir do projeto, importa comprimentos <strong>agregados por secção × condutor</strong> (ex.: total de F a 2,5 mm²), não uma linha por cada etiqueta de divisão. Assim o orçamento fica alinhado com bobinas e preços de catálogo.</p>

  <h2>Passo 1 — Projeto de cabos sólido</h2>
  <p>Cria o projeto e preenche as corridas: zona, tipo I/T/P/S/Q/G (secção automática), distância e spec. Confirma o resumo em direto: metros de tubo, metros de cabo e totais por secção. Corrige VJ e specs antes de orçamentar — corrigir depois obriga a atualizar quantidades.</p>

  <h2>Passo 2 — Catálogo de materiais</h2>
  <p>No catálogo defines materiais com preço de compra e de venda, unidade (incluindo metro), categoria e fornecedor. Quanto mais o catálogo refletir o que compras de verdade, mais rápido asscias cada total de cabo a um artigo. Podes importar/exportar o catálogo em JSON.</p>

  <h2>Passo 3 — Criar orçamento a partir do projeto</h2>
  <p>No projeto, usa a ação para criar orçamento. Para cada total secção × condutor, escolhe o material do catálogo correspondente. Podes acrescentar outros materiais, linhas manuais e mão de obra (hora, dia, unidade ou valor fixo). Há IVA configurável, desconto e margem global.</p>
  <p>Se mais tarde alterares os metros no projeto, o editor de orçamento pode detetar diferenças e <strong>atualizar quantidades</strong> a partir do projeto ligado — útil quando a medição em obra evolui.</p>

  <h2>Passo 4 — Margem, markup e vista interna</h2>
  <p>Mantém custo e venda separados. Usa margem ou markup de forma consciente (ver <a href="/guias/margem-vs-markup-orcamentos/">guia margem vs markup</a>). A vista interna mostra rentabilidade; a impressão ao cliente omite custos internos.</p>

  <h2>Passo 5 — Imprimir e arquivar</h2>
  <p>Imprime a vista profissional para entrega ao cliente. Exporta o orçamento ou o backup completo em JSON se quiseres arquivo independente da sincronização opcional. Numeração automática do tipo ORC-AAAA-NNN está disponível na app.</p>

  <h2>Checklist rápido</h2>
  <ol>
    <li>Metros e specs revistos (especialmente VJ ×2).</li>
    <li>Catálogo com preços de compra/venda atualizados.</li>
    <li>Orçamento gerado a partir do projeto; materiais mapeados.</li>
    <li>Mão de obra e IVA definidos.</li>
    <li>Rentabilidade interna OK; impressão sem custos internos.</li>
    <li>Backup JSON se precisares de partilhar um snapshot sem partilhar o UUID do espaço.</li>
  </ol>

  <h2>Privacidade neste fluxo</h2>
  <p>Tudo isto corre sem registo, nos dados do teu dispositivo. Sincronização opcional com código secreto; exportação JSON como backup. Software para eletricistas que precisa de funcionar offline em obra encaixa neste modelo.</p>

  <p>Para a base técnica dos metros, lê <a href="/guias/metros-de-cabo-por-circuito/">metros de cabo por circuito</a>. Para experimentar preços sem abrir a app completa, usa a <a href="/calculadora-margem-markup/">calculadora margem/markup</a>.</p>
  <p class="cta-row"><a class="btn btn-primary" href="/dashboard">Abrir CableFlow</a></p>
</article>`
}
