<script setup lang="ts">
/** 4.3 三体世界。文字旁边放实时三体运动模拟。 */
import { RouterLink } from 'vue-router'
import Plate from './Plate.vue'
import RevealBlock from './RevealBlock.vue'
import ThreeBodyCanvas from './ThreeBodyCanvas.vue'
import { TRISOLARIS } from '@/content/concepts'
</script>

<template>
  <section class="tri" aria-labelledby="tri-title">
    <div class="frame">
      <Plate :plate="TRISOLARIS.plate" sizes="100vw" />
    </div>

    <div class="section wrap">
      <RevealBlock as="h2" class="title" >
        <span id="tri-title">{{ TRISOLARIS.title }}</span>
      </RevealBlock>

      <div class="tri__split">
        <RevealBlock as="div" class="prose tri__prose">
          <p v-for="(p, i) in TRISOLARIS.paragraphs" :key="i" class="body">{{ p }}</p>
        </RevealBlock>

        <RevealBlock as="figure" class="tri__sim">
          <!--
            点开是满屏版（/simulation）：那里能调速、能重新开始。
            用 target="_blank" 在新标签页打开——读者正在读这一节，
            不该因为想看大图就丢掉滚动位置。
          -->
          <RouterLink to="/simulation" target="_blank" class="tri__sim-link">
            <ThreeBodyCanvas :size="480" />
            <span class="fine tri__sim-open">在新标签页看满屏版 · 可调速、可重新开始</span>
          </RouterLink>
          <figcaption class="fine tri__sim-caption">{{ TRISOLARIS.canvasCaption }}</figcaption>
        </RevealBlock>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 标题与正文是一组：32。 */
.tri__split {
  margin-top: var(--s-4);
  display: grid;
  gap: var(--s-5);
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.tri__prose {
  max-width: var(--measure-narrow);
}

.tri__sim {
  margin: 0;
}

/* 整块画布是个链接。hover 只改描边和那行提示的颜色，画布本身不缩放。 */
.tri__sim-link {
  display: block;
  border: 0;
}

.tri__sim-link :deep(.sim) {
  transition: border-color var(--dur-hover) var(--ease);
}

.tri__sim-link:hover :deep(.sim),
.tri__sim-link:focus-visible :deep(.sim) {
  border-color: var(--ink-0);
}

.tri__sim-open {
  display: block;
  margin-top: var(--s-2);
  max-width: 480px;
  color: var(--ink-1);
  transition: color var(--dur-hover) var(--ease);
}

.tri__sim-link:hover .tri__sim-open {
  color: var(--ink-0);
}

.tri__sim-caption {
  margin-top: var(--s-3);
  max-width: 480px;
  color: var(--ink-1);
}

@media (max-width: 980px) {
  .tri__split {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
