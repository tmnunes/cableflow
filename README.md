# CableFlow

https://cableflow-ruby.vercel.app/

Client-side tool for electricians and electrical contractors: measure cable runs, manage a material catalog, and build professional quotes. **No login / no email** — offline-first with LocalStorage, plus optional private cloud sync via a secret workspace UUID (Supabase).

**Measure → calculate → catalog → quote → print.**

## Privacy & sync

CableFlow does **not** use accounts. Data stays on your device by default. When cloud sync is configured:

1. On first visit the app creates a **secret UUID** (your workspace code) and stores your `AppData` in Supabase.
2. That code is shown under **Settings → Cloud workspace**. Anyone with the code can load the same data — treat it like a password.
3. Changes sync automatically (debounced). Conflicts use **last-write-wins** (silent).
4. Offline always works with LocalStorage; sync resumes when the network is back.
5. JSON export/import remains available as an independent backup.

Other users **cannot** see your workspace unless they know your UUID. There is no shared directory of codes.

To open the same space on another device: **Settings → Open another workspace** and paste the UUID.

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
- Optional cloud workspace sync (secret UUID via Supabase)
- Structured JSON export/import
- Automatic migration from legacy storage versions

## Stack

- React + TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui-style components (Radix)
- Lucide icons
- i18next
- Vitest
- Supabase (optional: Postgres + Edge Function)

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — enables cloud sync
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Without `VITE_SUPABASE_*` the app runs fully offline (LocalStorage only).

### Cloud sync setup (Supabase)

1. Run migration `supabase/migrations/20260825220000_cableflow_workspaces.sql` (SQL editor or `supabase db push`).
2. Deploy the function:

```bash
supabase functions deploy cableflow-workspace --project-ref jberponwqclwpipovgrf
```

3. Env (local / Vercel):

```bash
VITE_SUPABASE_URL=https://jberponwqclwpipovgrf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

`verify_jwt = false` for this function — access is gated by the secret workspace UUID (no Auth users).

### Production build

```bash
npm run build
npm run preview
```

The app is a client-side SPA (React Router). On Vercel, `vercel.json` rewrites unknown paths to `index.html` so a refresh on `/projects`, `/quotes/:id`, and similar routes does not 404.

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

**Local (always):** `localStorage` on the current browser.

**Cloud (optional):** Supabase table `cableflow_workspaces` — one JSON blob (`AppData`) per secret UUID. Direct table access is blocked by RLS; only the `cableflow-workspace` Edge Function (service role) can read/write.

| Key | Content |
|-----|---------|
| `cableflow:appdata` | Full app data (local cache) |
| `cableflow:workspace-code` | Secret UUID for cloud space |
| `cableflow:theme` | Light / dark preference |
| `cableflow:locale` | `en` or `pt` |

Legacy installs with `cableflow:project` (v1) are migrated automatically on first load.

### When to export JSON (still recommended)

- Extra backup besides the cloud UUID
- Before clearing browser data
- To share a snapshot file without sharing your live workspace code
- If you turn cloud sync off

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
