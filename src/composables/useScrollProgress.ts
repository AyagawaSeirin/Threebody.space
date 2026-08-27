import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 元素穿过视口的进度：0 = 刚从下方进入，1 = 刚从上方离开。
 * scroll 监听 passive，rAF 合并，只读一次 getBoundingClientRect。
 */
export function useScrollProgress() {
  const el: Ref<HTMLElement | null> = ref(null)
  const progress = ref(0)
  let frame = 0
  let attached = false

  function measure() {
    frame = 0
    const node = el.value
    if (!node) return
    const rect = node.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    const span = rect.height + vh
    const travelled = vh - rect.top
    progress.value = span > 0 ? Math.min(1, Math.max(0, travelled / span)) : 0
  }

  function schedule() {
    if (frame) return
    frame = requestAnimationFrame(measure)
  }

  onMounted(() => {
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    attached = true
  })

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
    if (!attached) return
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })

  return { el, progress }
}
