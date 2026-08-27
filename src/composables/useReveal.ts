import { onMounted, onBeforeUnmount, ref, type Ref } from 'vue'

/**
 * 进视口时给元素挂上 is-in。每个元素独立触发，不做 stagger 叠加延迟——
 * 第 12 条不该等 1.2 秒才出现。
 */
export function useReveal(options: { threshold?: number; rootMargin?: string; once?: boolean } = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -8% 0px', once = true } = options
  const el: Ref<HTMLElement | null> = ref(null)
  const shown = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const node = el.value
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      shown.value = true
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            shown.value = true
            if (once) observer?.disconnect()
          } else if (!once) {
            shown.value = false
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(node)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { el, shown }
}
