/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Cloud secrets stay server-side. Public donate URL is safe in the browser.
  readonly VITE_KOFI_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
