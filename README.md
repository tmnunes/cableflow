# CableFlow
https://cableflow-ruby.vercel.app/

Client-side cable length calculator for electricians working on residential and commercial buildings.

Create a project, add cable runs (one per conduit), and get live totals grouped by cable section and conductor type. No backend, no login — everything runs in the browser with optional LocalStorage autosave and JSON import/export.

## Features

- Project with multiple cable runs
- Automatic cable section from circuit type (I / T / P / Q / G)
- Spec parser for codes like `FTN`, `F2R`, `2VJTN`, `4VJ`, `3F2N`, `FRTN`
- Conductor color swatches (F brown, R orange, VJ grey, N blue, T green/yellow)
- Live summary by section × conductor
- Editable table: search, sort, inline edit, duplicate, delete
- English / Portuguese i18n
- Light / dark mode
- Autosave to LocalStorage
- Undo last delete
- Keyboard shortcuts: `Ctrl/Cmd+S` export, `Ctrl/Cmd+O` import, `Ctrl/Cmd+P` print, `Ctrl/Cmd+Z` undo delete
- Print-friendly layout (Print button or browser print)

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui-style components (Radix)
- Lucide icons
- i18next

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

## JSON import / export

Export shape:

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

`conduit` is the number of conductors the conduit holds (e.g. `4`). It must equal the total conductor count in `spec` (`FTN` → 3). Legacy strings like `"4C"` are accepted on import and normalized to `4`.

Invalid files are rejected with a clear message; valid files replace the current project immediately.

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
  components/   UI + feature components
  pages/        App screens
  hooks/        State & side effects
  utils/        Parser, calculations, validation
  services/     Storage + import/export
  data/         Circuit catalogue + sample project
  types/        Shared TypeScript types
  i18n/         English & Portuguese strings
```

## Extending

- New conductor codes → add to `src/data/circuits.ts` (`CONDUCTORS`)
- Materials / cost / multi-project / PDF / CSV / sync → keep calculations in `utils/` and persistence in `services/` so new features plug in without rewriting the table or summary UI
