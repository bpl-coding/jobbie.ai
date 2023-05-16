/// <reference types="vite/client" />

interface ImportMetaEnv {
    VITE_API_BASE_URI: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}