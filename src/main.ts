import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { IS_INLINED, imageSrc } from './content/assets'

import './styles/tokens.css'
import './styles/base.css'
import './styles/type.css'
import './styles/layout.css'

/**
 * 首屏图的 preload 按路由插：hero-void 只在 / 用得上，
 * 写死在 index.html 里会让 /sentences、/works 白下一份。
 * AVIF 优先，靠 type 让不支持的浏览器忽略它（<picture> 里还有 webp/jpg 兜底）。
 */
if (!IS_INLINED && location.pathname === import.meta.env.BASE_URL) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.type = 'image/avif'
  link.href = imageSrc('hero-void', 'avif')
  link.setAttribute('fetchpriority', 'high')
  document.head.appendChild(link)
}

createApp(App).use(router).mount('#app')
