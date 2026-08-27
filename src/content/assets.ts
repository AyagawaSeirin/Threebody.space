/**
 * 静态资源的地址解析。
 *
 * 正常部署时就是 public/ 下的真实路径。
 * 但单文件预览（Artifact 只允许一个自包含的 HTML，外部请求会被 CSP 拦掉）
 * 需要把图片和书摘直接内联进页面，这时由构建脚本注入下面两个全局量。
 * 组件只管调这里，不用关心自己跑在哪种环境里。
 */

interface InlinedAssets {
  images?: Record<string, Partial<Record<ImageExt, string>>>
  sentences?: unknown
}

export type ImageExt = 'avif' | 'webp' | 'jpg'

const inlined = (globalThis as { __THREEBODY_ASSETS__?: InlinedAssets })
  .__THREEBODY_ASSETS__

/** true 表示资源已内联，页面不需要（也不能）再发请求 */
export const IS_INLINED = Boolean(inlined)

export function imageSrc(name: string, ext: ImageExt): string {
  const hit = inlined?.images?.[name]?.[ext]
  return hit ?? `${import.meta.env.BASE_URL}images/${name}.${ext}`
}

export function inlinedSentences(): unknown | null {
  return inlined?.sentences ?? null
}
