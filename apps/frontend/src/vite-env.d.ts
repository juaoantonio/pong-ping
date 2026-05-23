/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCIAL_AUTH_DEV_BYPASS_ENABLED?: string;
  readonly VITE_TENANT_FRONTEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
