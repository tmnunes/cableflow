/// <reference types="vite/client" />

interface ImportMetaEnv {
  // No Supabase secrets in the browser — cloud sync uses /api/workspace (server-only env).
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
