import { onScopeDispose, readonly, ref } from 'vue'

// 全站统一从这里读「减弱动态效果」。组件不要各自写 matchMedia。
const query = '(prefers-reduced-motion: reduce)'
const reduced = ref(false)
let watching = false

function start() {
  if (watching || typeof window === 'undefined' || !window.matchMedia) return
  watching = true
  const mq = window.matchMedia(query)
  reduced.value = mq.matches
  mq.addEventListener('change', (e) => {
    reduced.value = e.matches
  })
}

export function useReducedMotion() {
  start()
  return readonly(reduced)
}

// 给非组件上下文（Canvas 循环、路由守卫）用的同步读法
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}

// 组件卸载时不需要解绑全局监听（单例常驻），这里只是保留钩子位置
export function disposeOnScope(fn: () => void) {
  onScopeDispose(fn)
}
