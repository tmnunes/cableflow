# CableFlow

https://cableflow-ruby.vercel.app/

Client-side tool for electricians and electrical contractors: measure cable runs, manage a material catalog, and build professional quotes. No backend, no login, no database — everything runs in the browser with LocalStorage autosave and JSON import/export.

**Measure → calculate → catalog → quote → print.**

## Features

### Cable calculation (CableFlow core)

- Multiple projects with cable runs (one row per conduit)
- Automatic cable section from circuit type (I / T / P / Q / G)
- Spec parser for codes like `FTN`, `F2R`, `2VJTN`, `4VJ`, `3F2N`, `FRTN`
- Conductor color swatches (F brown, R orange, VJ grey, N blue, T green/yellow)
- Live summary by section × conductor
- Editable table: search, sort, inline edit, duplicate, delete, undo
- Keyboard shortcuts on cable view: `Ctrl/Cmd+S` export project, `Ctrl/Cmd+O` import, `Ctrl/Cmd+P` print, `Ctrl/Cmd+Z` undo delete

### Materials & suppliers

- Material catalog with purchase/sale prices, categories, units, supplier link
- Supplier directory
- Search, filter, sort, activate/deactivate, duplicate
- Import/export each catalog as JSON

### Quotes

- Create quotes manually or **from a cable project**
- Import cable lengths aggregated by **section × conductor** (e.g. total meters of F @ 2.5 mm² — not per room/circuit label)
- Map each cable type to a catalog material
- Add materials from catalog or custom lines
- Labour lines (hour / day / unit / fixed amount)
- Separate purchase cost vs sale price; margin and markup calculations
- Configurable VAT, discount, global margin
- Internal profitability view (cost, profit, margin %, markup %)
- Professional print layout (client-facing — no internal costs)
- Automatic quote numbering (`ORC-2026-001`, …)

### App

- Dashboard with project/quote/catalog overview
- English / Portuguese i18n
- Light / dark mode
- Full backup export/import (all data in one JSON file)
- Automatic migration from legacy single-project storage (v1 → v2)

## Stack

- React + TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui-style components (Radix)
- Lucide icons
- i18next
- Vitest (pricing & cable import tests)

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

### Tests

```bash
npm run test
```

Covers pricing (margin ≠ markup), quote totals, VAT, and aggregated cable import.

## Navigation

| Section     | Route                              |
|-------------|------------------------------------|
| Dashboard   | `/dashboard`                       |
| Projects    | `/projects`                        |
| Cables      | `/projects/:id/cables`             |
| Materials   | `/materials`                       |
| Suppliers   | `/suppliers`                       |
| Quotes      | `/quotes`, `/quotes/:id`           |
| From project| `/quotes/from-project/:projectId`  |
| Settings    | `/settings`                        |

## Workflow: project → quote

1. Create a project and add cable runs.
2. Open the project → **Create quote**.
3. For each **section × conductor** total (e.g. F @ 2.5 mm² — 120 m), select the catalog material.
4. Add other materials, labour, adjust prices/margin.
5. Print or export the quote JSON.

If cable lengths change later, the quote editor detects the difference and can **update quantities** from the linked project.

## Data storage

All data is stored locally in the browser (`localStorage`). Nothing is sent to a server.

| Key                  | Content                    |
|----------------------|----------------------------|
| `cableflow:appdata`  | Full app data (v2)         |
| `cableflow:theme`    | Light / dark preference    |
| `cableflow:locale`   | `en` or `pt`               |

Legacy installs with `cableflow:project` (v1) are migrated automatically on first load.

## JSON import / export

### Project (v1 — backward compatible)

Single-project export from the cable view or projects list:

```json
{
  "projectName": "Villa Algarve",
  "version": 1,
  "items": [
    {
      "description": "Q1.1",
      "distance": 5,
      "type": "I",
      "conduit": 3,
      "spec": "FTN",
      "notes": ""
    }
  ]
}
```

`conduit` is the number of conductors the conduit holds (e.g. `4`). It must equal the total conductor count in `spec` (`FTN` → 3). Legacy strings like `"4C"` are accepted on import.

### Full backup (v2)

From **Settings → Export full backup**:

```json
{
  "version": 2,
  "projects": [],
  "materials": [],
  "suppliers": [],
  "quotes": [],
  "companySettings": {},
  "quoteNumberState": {}
}
```

Import merges with existing data.

### Partial exports

- **Materials** — `{ "version": 2, "materials": [...] }`
- **Suppliers** — `{ "version": 2, "suppliers": [...] }`
- **Quote** — `{ "version": 2, "quote": { ... } }`

## Pricing

Purchase cost and sale price are kept separate. Margin and markup are **not** the same:

| Concept | Formula (conceptual)     | Example (cost 100 €) |
|---------|--------------------------|----------------------|
| Margin 20% | sale = cost / (1 − 0.20) | sale = **125 €**  |
| Markup 25% | sale = cost × (1 + 0.25) | sale = **125 €**  |

At the same percentage, margin yields a higher sale price than markup. Calculations live in `src/utils/pricing/` and `src/utils/quotes/`.

## Circuit sections

| Type | Meaning      | Section |
|------|--------------|---------|
| I    | Lighting     | 1.5 mm² |
| T    | Socket       | 2.5 mm² |
| P    | Power        | 4 mm²   |
| Q    | Large Power  | 10 mm²  |
| G    | Main Feed    | 16 mm²  |

## Spec grammar

`[quantity?][code]` repeated. Quantity defaults to `1`. Codes: `F`, `R`, `VJ`, `N`, `T` (longest match first).

Examples:

- `FTN` → 1×F, 1×T, 1×N
- `F2R` → 1×F, 2×R
- `2VJTN` → 2×VJ, 1×T, 1×N

Each conductor length = quantity × run distance.

## Project layout

```
src/
  components/
    layout/       App shell, sidebar, header
    project/      Cable runs table, conductor swatches
    summary/      Stats cards, live summary panel
    materials/    (via pages)
    quotes/       Quote tables, summary, print view
    settings/     Company profile form
    ui/           Shared UI primitives
  pages/          Dashboard, projects, cables, materials, suppliers, quotes, settings
  hooks/          useAppData, useProject
  utils/
    parser.ts     Spec parser (do not change lightly)
    calculations.ts
    pricing/      Margin, markup, tax
    quotes/       Quote line & total calculations
    cable/        Project → quote import (aggregation layer)
    money/        Currency helpers
  services/
    storage/      LocalStorage, migration v1→v2
    importExport.ts
    quotes/       Quote numbering
  data/           Circuit catalogue, sample project
  types/          cable, material, supplier, quote, app, …
  i18n/           English & Portuguese
```

## Extending

- New conductor codes → `src/data/circuits.ts` (`CONDUCTORS`)
- Cable math → `src/utils/parser.ts`, `src/utils/calculations.ts` (keep unchanged for quote features)
- Quote / pricing → `src/utils/pricing/`, `src/utils/quotes/`
- Project → quote mapping → `src/utils/cable/quoteImport.ts` (aggregation; does not alter cable calculations)
- Persistence → `src/services/storage/` (never call `localStorage` from components)
