import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref } from 'vue'

/**
 * 满幅图为了不吃掉整屏高度，会被 object-fit: cover 裁掉一部分。
 * 一旦发生裁切，「图片坐标系里的 72.47%」就不再等于「容器里的 72.47%」——
 * 红岸那盏灯和黑暗森林那根光针都是按图片像素实测定位的，必须跟着裁切走。
 *
 * 这个 composable 把图片的自然尺寸和容器尺寸算成一个映射函数：
 * 传入图片坐标系的百分比，返回容器坐标系的百分比。
 * 纯 CSS 做不到这件事（cover 的裁切量不暴露给样式），所以用 ResizeObserver 量。
 */
/** object-position 的纵向值 → 0..1 的对齐比例 */
function focusRatio(focus?: string): number {
  if (!focus || focus === 'center') return 0.5
  if (focus === 'top') return 0
  if (focus === 'bottom') return 1
  const pct = Number.parseFloat(focus)
  return Number.isFinite(pct) ? Math.min(1, Math.max(0, pct / 100)) : 0.5
}

export function useCoverBox(plate: {
  width: number
  height: number
  focus?: 'top' | 'center' | 'bottom' | string
}) {
  const natural = plate
  const host: Ref<HTMLElement | null> = ref(null)
  const box = ref({ left: 0, top: 0, width: 100, height: 100 })

  function measure() {
    const el = host.value
    if (!el) return
    const cw = el.clientWidth
    const ch = el.clientHeight
    if (!cw || !ch) return

    // cover：按较大的那个比例铺满，超出的部分被裁掉
    const scale = Math.max(cw / natural.width, ch / natural.height)
    const drawnW = natural.width * scale
    const drawnH = natural.height * scale

    // 裁掉哪一段由 object-position 决定（Plate.focus）：
    // 0 = 保上缘，0.5 = 居中，1 = 保下缘。必须和 CSS 用同一个值，
    // 否则叠加层会按居中算，而图片按 focus 画，两者错开。
    const alignY = focusRatio(plate.focus)

    box.value = {
      left: ((cw - drawnW) / 2 / cw) * 100,
      top: ((ch - drawnH) * alignY / ch) * 100,
      width: (drawnW / cw) * 100,
      height: (drawnH / ch) * 100,
    }
  }

  /**
   * 图片坐标系的百分比 → 容器坐标系的百分比。
   * 返回 computed：容器尺寸会变（窗口缩放、竖屏旋转），
   * 返回普通对象的话就只在挂载前算了一次，位置永远停在未换算的原值上。
   */
  function at(xPct: number, yPct: number): ComputedRef<Record<string, string>> {
    return computed(() => ({
      left: `${box.value.left + (xPct / 100) * box.value.width}%`,
      top: `${box.value.top + (yPct / 100) * box.value.height}%`,
    }))
  }

  /** 图片坐标系里的一段高度 → 容器坐标系的高度 */
  function spanY(hPct: number): ComputedRef<string> {
    return computed(() => `${(hPct / 100) * box.value.height}%`)
  }

  let ro: ResizeObserver | null = null
  onMounted(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined' && host.value) {
      ro = new ResizeObserver(measure)
      ro.observe(host.value)
    } else {
      window.addEventListener('resize', measure, { passive: true })
    }
  })
  onBeforeUnmount(() => {
    ro?.disconnect()
    window.removeEventListener('resize', measure)
  })

  return { host, at, spanY }
}
