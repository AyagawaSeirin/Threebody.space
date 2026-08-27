<script setup lang="ts">
/**
 * 一条书摘。形态由 weight 决定，不由容器决定：
 * display（148 条，≤30 字）独占一大片黑；
 * normal（148 条，31–80 字）居中一栏；
 * passage（127 条，>80 字）按正常文章段落排。
 *
 * 没有卡片、没有边框、没有引号图标、没有左边框色条。
 * 视觉锚点只有一条 1px × 12px 的短竖线。
 * hover 什么都不做——这是文字，不是按钮。
 */
import { computed } from 'vue'
import { useReveal } from '@/composables/useReveal'
import type { Sentence } from '@/content/sentences'

const props = defineProps<{ sentence: Sentence; highlight?: string }>()

// 每条独立触发，不做 stagger 叠加延迟。display 慢一点（560ms），它占满一屏。
const { el, shown } = useReveal({ threshold: 0.1 })
const slow = props.sentence.weight === 'display'

/**
 * 把每一行按检索词切成「命中 / 非命中」的片段。
 * 用片段拼 DOM，不走 v-html——原文里出现 < 或 & 时不会被当成标签。
 */
interface Segment {
  text: string
  hit: boolean
}

const segmented = computed<Segment[][]>(() => {
  const q = props.highlight?.trim()
  if (!q) return props.sentence.lines.map((line) => [{ text: line, hit: false }])

  return props.sentence.lines.map((line) => {
    const out: Segment[] = []
    let from = 0
    for (;;) {
      const at = line.indexOf(q, from)
      if (at < 0) break
      if (at > from) out.push({ text: line.slice(from, at), hit: false })
      out.push({ text: q, hit: true })
      from = at + q.length
    }
    if (from < line.length) out.push({ text: line.slice(from), hit: false })
    return out.length ? out : [{ text: line, hit: false }]
  })
})
</script>

<template>
  <article
    ref="el"
    class="quote reveal"
    :class="[`quote--${sentence.weight}`, { 'reveal--slow': slow, 'is-in': shown }]"
  >
    <span class="quote__mark" aria-hidden="true"></span>

    <blockquote class="quote__text" :class="{ 'quote__text--dialogue': sentence.dialogue }">
      <!-- 逐行渲染。对白行间距比段内行高更松，不合并成一段。 -->
      <p v-for="(segments, i) in segmented" :key="i" class="quote__line">
        <template v-for="(seg, j) in segments" :key="j">
          <!-- 这是检索命中的真实标注，不是给正文关键词上色：无背景色，只加重字重。 -->
          <!-- deslop-ignore-next-line 09 13 -->
          <mark v-if="seg.hit" class="quote__hit">{{ seg.text }}</mark>
          <template v-else>{{ seg.text }}</template>
        </template>
      </p>
    </blockquote>

    <!-- 只有 28 条有署名；其余 395 条这里什么都不出现。 -->
    <p v-if="sentence.attribution" class="fine quote__by">—— {{ sentence.attribution }}</p>
  </article>
</template>

<style scoped>
.quote {
  position: relative;
  padding-left: var(--s-4);
}

/* 唯一的视觉锚点：1px × 12px 短竖线 */
.quote__mark {
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 1px;
  height: 12px;
  background: var(--ink-2);
}

.quote__text {
  margin: 0;
}

.quote__line + .quote__line {
  margin-top: 0;
}

/* display：40–88px，一句占一大片黑。字数少，能扛住这个尺寸。 */
.quote--display .quote__text {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(28px, 5.2vw, 56px);
  line-height: 1.28;
  letter-spacing: 0.01em;
  max-width: 22em;
}

/* normal：22px，居中一栏，最宽 34 个中文字 */
.quote--normal .quote__text {
  font-size: var(--t-lead);
  line-height: var(--lh-lead);
  max-width: var(--measure);
}

/* passage：17px 宋体，正常段落，行高 1.9 */
.quote--passage .quote__text {
  font-size: var(--t-body);
  line-height: var(--lh-body);
  max-width: var(--measure);
}

/* 对白：行间距从 1.9 放到 2.4，靠换行区分说话人，不给不同人上不同颜色 */
.quote__text--dialogue .quote__line {
  line-height: var(--lh-dialogue);
}

.quote--display .quote__text--dialogue .quote__line {
  line-height: 1.6;
}

/* 检索命中的标记：加粗 + 主文字色，没有背景色。
   中文搜索高亮做成黄色荧光笔是典型 slop，这里只是把命中的字加重一点。 */
/* deslop-ignore-next-line 09 13 */
.quote__hit {
  background: none;
  color: var(--ink-0);
  font-weight: 700;
}

.quote__by {
  margin-top: var(--s-3);
  max-width: var(--measure);
  text-align: right;
}

.quote--display .quote__by {
  max-width: 22em;
}
</style>
