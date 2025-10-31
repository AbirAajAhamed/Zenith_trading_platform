/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string;
  // এখানে ভবিষ্যতে আরও এনভায়রনমেন্ট ভেরিয়েবল যোগ করা যাবে
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}