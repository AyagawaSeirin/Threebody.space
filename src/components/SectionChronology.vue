<script setup lang="ts">
/**
 * 年表。放在「二向箔」之后、尺度尺之前：
 * 前面几节讲的是概念，这里把它们按发生顺序钉一遍。
 *
 * 序号是纪年，是真有顺序的数据，不是营销式的 01/02/03。
 * 一条 1px 竖线串起来，没有卡片，没有圆角框。
 */
import RevealBlock from './RevealBlock.vue'
import { CHRONOLOGY, CHRONOLOGY_NOTE } from '@/content/chronology'
</script>

<template>
  <section class="section wrap chron" aria-labelledby="chron-title">
    <RevealBlock as="h2" class="title">
      <span id="chron-title">顺序</span>
    </RevealBlock>

    <ol class="chron__list">
      <RevealBlock v-for="e in CHRONOLOGY" :key="e.stamp" as="li" class="chron__item">
        <p class="data chron__stamp" :class="{ 'is-signal': e.signal }">
          <time v-if="e.datetime" :datetime="e.datetime">{{ e.stamp }}</time>
          <template v-else>{{ e.stamp }}</template>
          <!-- 公元年份是推算值，用「≈」和更弱的灰标出来，别和纪年抢 -->
          <time
            v-if="e.gregorian"
            class="chron__gregorian"
            :datetime="String(e.gregorian)"
          >（约公元 {{ e.gregorian }} 年）</time>
        </p>
        <p class="body chron__text">{{ e.text }}</p>
      </RevealBlock>
    </ol>

    <p class="fine chron__note">{{ CHRONOLOGY_NOTE }}</p>
  </section>
</template>

<style scoped>
/* 1px 竖线画在 ol 上，条目自己不带边框 */
.chron__list {
  position: relative;
  margin-top: var(--s-5);
  padding-left: var(--s-4);
}

.chron__list::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--s-1);
  bottom: var(--s-1);
  width: 1px;
  background: var(--ink-2);
}

/* 同一序列内的条目 32，比它到上一节的 160 明显近 */
.chron__item + .chron__item {
  margin-top: var(--s-4);
}

.chron__stamp {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2);
  font-size: var(--t-fine);
  color: var(--ink-1);
}

/* 推算出来的公元年份：它是参考不是事实，所以要比纪年弱一档。
   但不能用 opacity 压——--ink-1 本身只有 6.06:1，乘 0.72 就掉到 3.48:1，
   14px 正文不到 4.5:1 这条线。改用括号和字号做层级，颜色照旧。 */
.chron__gregorian {
  color: var(--ink-1);
}

/* signal 只染纪年本身，公元那一段不跟着变红 */
.chron__stamp.is-signal .chron__gregorian {
  color: var(--ink-1);
}

/* 威慑失败与二向箔：这两笔是收不回的决定，用唯一强调色标 */
.chron__stamp.is-signal {
  color: var(--signal);
}

.chron__text {
  margin-top: var(--s-1);
  max-width: var(--measure);
}

.chron__note {
  margin-top: var(--s-5);
}
</style>
