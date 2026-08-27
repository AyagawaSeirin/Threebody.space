<script setup lang="ts">
/**
 * 书摘流。单栏、竖向、一句一屏或一句一段——不是砖墙，不是卡片网格。
 * 节奏由 weight（长短）自然产生，不人为设计「变化」。
 *
 * 分批追加：首屏 12 条，哨兵进视口再追 12 条。
 * 没有「加载更多」按钮，也没有旋转指示器。
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import SentenceItem from './SentenceItem.vue'
import type { Sentence } from '@/content/sentences'

const props = defineProps<{
  items: Sentence[]
  exhausted: boolean
  loaded: boolean
  failed: boolean
  /** 检索词，传下去让命中的字加重 */
  highlight?: string
}>()

const emit = defineEmits<{ more: [] }>()

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

/**
 * 挂哨兵。每次追加之后都重挂一遍：
 * 若追加进来的内容不够高，哨兵仍然停在视口里，IntersectionObserver
 * 不会因为「状态没变化」再回调；断开重连会重新报告一次当前的相交状态，
 * 于是继续追加，直到哨兵被真的推出视口。
 */
function attach() {
  observer?.disconnect()
  observer = null
  const node = sentinel.value
  if (!node || props.exhausted) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) emit('more')
    },
    // 提前一屏开始追加，读者滚到底时内容已经在了
    { rootMargin: '0px 0px 60% 0px' },
  )
  observer.observe(node)
}

// flush: 'post' 是必须的：数据到达那一刻 exhausted 才从 true 翻成 false，
// 哨兵这时还没渲染出来；默认的 pre-flush 会在 DOM 更新前跑，拿到的是 null。
watch(
  () => [props.exhausted, props.items.length] as const,
  attach,
  { flush: 'post', immediate: true },
)

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="stream">
    <SentenceItem
      v-for="s in items"
      :key="s.id"
      :sentence="s"
      :highlight="highlight"
      class="stream__item"
    />

    <!-- 触底哨兵。它本身不显示任何东西。 -->
    <div v-if="!exhausted" ref="sentinel" class="stream__sentinel" aria-hidden="true"></div>

    <p v-if="failed" class="body stream__msg">书摘没有加载出来，刷新一次试试。</p>
    <p v-else-if="loaded && !items.length" class="body stream__msg">没有找到含这个词的句子。</p>
  </div>
</template>

<style scoped>
/* 条与条之间 96px 空白，没有分割线。
   （96 不在间距表里，是书摘这一节自己的节奏值：比段间 64 松，比章节间 160 紧。） */
.stream__item + .stream__item {
  margin-top: 96px;
}

/* display 档独占一大片黑：它前后各拉到 160。
   quote--display 与 stream__item 同在子组件根元素上，直接组合选择即可。 */
.stream__item + .stream__item.quote--display,
.stream__item.quote--display + .stream__item {
  margin-top: var(--s-6);
}

.stream__sentinel {
  height: 1px;
}

.stream__msg {
  color: var(--ink-1);
}
</style>
