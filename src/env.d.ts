/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

/** 由 vite.standalone.config.ts 注入；正常构建时不存在 */
declare const __THREEBODY_HASH_ROUTER__: boolean | undefined
