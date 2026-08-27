import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { loadSentences, type Sentence, type SentenceStats } from '@/content/sentences'

const BATCH = 12

/**
 * 书摘的加载与分批追加。
 * 423 条全塞进 DOM 会拖垮首屏，所以首屏 12 条，触底再追 12 条。
 * 没有「加载更多」按钮，也没有旋转指示器。
 */
export function useSentences() {
  const all = shallowRef<Sentence[]>([])
  const stats = ref<SentenceStats | null>(null)
  const loaded = ref(false)
  const failed = ref(false)
  const shown = ref(BATCH)
  const query = ref('')
  const debounced = ref('')

  let timer = 0
  watch(query, (v) => {
    window.clearTimeout(timer)
    // 输入防抖 200ms
    timer = window.setTimeout(() => {
      debounced.value = v.trim()
      shown.value = BATCH
    }, 200)
  })
  onBeforeUnmount(() => window.clearTimeout(timer))

  loadSentences()
    .then((file) => {
      all.value = file.sentences
      stats.value = file.stats
      loaded.value = true
    })
    .catch(() => {
      failed.value = true
    })

  /** 纯前端 includes 检索，423 条不需要索引库 */
  const matched = computed(() => {
    const q = debounced.value
    if (!q) return all.value
    return all.value.filter(
      (s) =>
        s.lines.some((line) => line.includes(q)) ||
        (s.attribution ? s.attribution.includes(q) : false),
    )
  })

  const visible = computed(() => matched.value.slice(0, shown.value))
  const exhausted = computed(() => shown.value >= matched.value.length)

  function more() {
    if (!exhausted.value) shown.value += BATCH
  }

  return { all, stats, loaded, failed, query, debounced, matched, visible, exhausted, more }
}

/** 从 display 档里随机取一句，避免和上一句重复 */
export function pickDisplay(pool: Sentence[], avoid?: string): Sentence | null {
  const candidates = pool.filter((s) => s.weight === 'display' && s.id !== avoid)
  if (!candidates.length) return null
  const bucket = new Uint32Array(1)
  crypto.getRandomValues(bucket)
  return candidates[bucket[0]! % candidates.length]!
}
