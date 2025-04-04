/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOKEN_ADDRESS: string
  readonly VITE_MARKETPLACE_ADDRESS: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
