# FACTS_TO_VERIFY

Afirmações técnicas/normativas usadas nas páginas públicas. Confirmar antes de as tratar como conformidade normativa.

| Página | Afirmação | Fonte a consultar |
|--------|-----------|-------------------|
| Landing / guias metros | Secções por tipo na app: I 1,5 · T 2,5 · P 4 · S 6 · Q 10 · G 16 mm² | Tabela interna `src/data/circuits.ts` e README; **não** é por si uma tabela RTIEBT/IEC — validar face ao projeto elétrico e normas aplicáveis no país |
| Guias metros | Cores de condutores na UI: F castanho, R laranja, VJ cinza, N azul, T verde/amarelo, C preto | Convenção visual da app (`CONDUCTORS` em `circuits.ts`); confirmar se coincide com a prática/norma local de identificação de condutores |
| Guias metros | Fator de distância VJ = ×2 | Comportamento documentado da app (`conductorDistanceFactor`); validar se o fator ×2 reflecte a prática de medição/compra do instalador |
| Guias metros | Spec `C` conta 3 condutores para «enchimento» do tubo mas metros de cabo = quantidade × distância (não ×3) | `calculations.ts` / README — confirmar se a regra de enchimento do tubo na obra usa o mesmo critério |
| Landing / FAQ | A app «não substitui o projeto de especialidade» | Posicionamento de produto; manter em comunicação comercial |
| Guias orçamento | Numeração `ORC-AAAA-NNN` | Comportamento da app; não é requisito legal de faturação |
| Qualquer página | Referências a conformidade RTIEBT, IEC 60364, ou cores oficiais de condutores | **Não afirmadas** no conteúdo público actual — só adicionar com citação de norma/edição |

## TODO (negócio / marketing)

- Decidir se haverá `offers`/preço em JSON-LD `SoftwareApplication` (hoje omitido de propósito).
- Fornecer screenshots em `/public/screens/` (ver resumo do PR/SEO).
