import { fileURLToPath, URL } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 单文件构建，用于在线预览（Artifact 只接受一个自包含的 HTML，
 * 且 CSP 会拦掉所有外部请求）。与正常部署的差别只有三处：
 *
 * 1. 图片（avif/webp/jpg 三套）和 423 条书摘全部内联进页面；
 * 2. 所有 JS/CSS 内联，不做代码分割 —— 单文件里没有第二个请求可发；
 * 3. 路由切成 hash 模式 —— 预览环境没有服务端，/sentences 这种路径会 404。
 *
 * 站点本身的代码不为此分叉：资源地址统一走 src/content/assets.ts 解析。
 */

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const MIME: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
}

/**
 * 把构建出来的 JS/CSS 塞回 HTML 里，删掉原来的 <script src> / <link href>。
 * generateBundle 阶段做，能直接改 bundle，不用再落一次盘。
 */
function inlineCode(): Plugin {
  return {
    name: 'threebody-inline-code',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = Object.values(bundle)
      const htmlFile = files.find((f) => f.fileName.endsWith('.html'))
      if (!htmlFile || htmlFile.type !== 'asset') return

      let html = String(htmlFile.source)
      const escapeClose = (code: string) => code.replace(/<\/(script|style)/gi, '<\\/$1')

      /*
        拆掉 Vite 的模块预载包装。
        路由的 import() 会被包成 __vitePreload(() => …, __VITE_PRELOAD__)，
        而 __VITE_PRELOAD__ 这个占位符只在开启代码分割时才会被替换成真实的依赖表。
        单文件构建把动态 import 全部内联，占位符原样留在产物里，
        每个路由一加载就 ReferenceError，整站白屏（build 阶段一点征兆都没有）。
        单文件里没有第二个 chunk 可预载，直接把包装还原成裸的 import 工厂。
      */
      const unwrapPreload = (code: string) =>
        code
          .replace(
            /\b([A-Za-z_$][\w$]*)\(\s*(\(\)\s*=>[^,]+?)\s*,\s*__VITE_PRELOAD__\s*\)/g,
            (_m, _helper, factory) => `(${factory})()`,
          )
          .replace(/,\s*__VITE_PRELOAD__/g, '')

      // 按文件名精确匹配整个标签（属性顺序不固定，所以先框住标签再看里面的 src/href），
      // 匹配不到就报错——静默留下一个 /assets/ 请求会让预览页白屏。
      const replaceTag = (pattern: RegExp, name: string, replacement: string) => {
        const before = html
        html = html.replace(pattern, () => replacement)
        if (html === before) {
          this.error(`没能把 ${name} 内联进 HTML：标签没匹配上`)
        }
      }

      for (const file of files) {
        const fname = file.fileName
        if (file.type === 'chunk') {
          replaceTag(
            new RegExp(`<script\\b[^>]*\\bsrc="[^"]*${fname}"[^>]*>\\s*</script>`),
            fname,
            `<script type="module">\n${escapeClose(unwrapPreload(file.code))}\n</script>`,
          )
          delete bundle[fname]
        } else if (fname.endsWith('.css')) {
          replaceTag(
            new RegExp(`<link\\b[^>]*\\bhref="[^"]*${fname}"[^>]*>`),
            fname,
            `<style>\n${escapeClose(String(file.source))}\n</style>`,
          )
          delete bundle[fname]
        }
      }

      // modulepreload 指向已经删掉的文件；favicon 是外部请求，CSP 会拦
      html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g, '')
      html = html.replace(/<link\b[^>]*rel="icon"[^>]*>/g, () => {
        const svg = readFileSync(resolve(ROOT, 'public/favicon.svg'), 'utf8')
        const b64 = Buffer.from(svg, 'utf8').toString('base64')
        return `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${b64}">`
      })

      const leftover = html.match(/(?:src|href)="\/(?:assets|images|data)\/[^"]*"/)
      if (leftover) this.error(`HTML 里还留着外部引用：${leftover[0]}`)
      if (html.includes('__VITE_PRELOAD__')) {
        this.error('产物里还留着 __VITE_PRELOAD__ 占位符，路由会白屏')
      }

      htmlFile.source = html
    },
  }
}

/** 把 public/images 与书摘数据编成一段内联脚本，注入到 <head> */
function inlineAssets(): Plugin {
  return {
    name: 'threebody-inline-assets',
    enforce: 'post',
    transformIndexHtml() {
      const dir = resolve(ROOT, 'public/images')
      const images: Record<string, Record<string, string>> = {}
      for (const file of readdirSync(dir)) {
        const ext = extname(file).slice(1)
        if (!MIME[ext]) continue
        const name = basename(file, `.${ext}`)
        const b64 = readFileSync(resolve(dir, file)).toString('base64')
        ;(images[name] ??= {})[ext] = `data:${MIME[ext]};base64,${b64}`
      }
      const sentences = JSON.parse(
        readFileSync(resolve(ROOT, 'src/content/sentences.json'), 'utf8'),
      )
      const payload = JSON.stringify({ images, sentences })
      return [
        {
          tag: 'script',
          attrs: { id: 'threebody-assets', type: 'application/json' },
          children: payload.replace(/</g, '\\u003c'),
          injectTo: 'head',
        },
        {
          tag: 'script',
          children:
            'globalThis.__THREEBODY_ASSETS__ = JSON.parse(' +
            'document.getElementById("threebody-assets").textContent);',
          injectTo: 'head',
        },
      ]
    },
  }
}

export default defineConfig({
  define: {
    // 预览环境没有服务端，History 路由的 /sentences 会 404 —— 切 hash 路由
    __THREEBODY_HASH_ROUTER__: 'true',
  },
  plugins: [vue(), inlineAssets(), inlineCode()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    outDir: 'dist-standalone',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    /*
      关掉模块预载 helper。
      路由用的是 import()，Vite 会给它套一层 preload helper，里面带着
      __VITE_PRELOAD__ 占位符——那个占位符只在开启代码分割时才会被替换。
      单文件构建把动态 import 全部内联，占位符原样留在产物里，
      于是每个路由一加载就 ReferenceError，页面直接白屏。
      单文件里本来也没有第二个 chunk 需要预载，关掉即可。
    */
    modulePreload: false,
    // 单文件：不分割，全部内联
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
})
