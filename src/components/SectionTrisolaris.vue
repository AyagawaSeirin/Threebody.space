<script setup lang="ts">
/** 4.3 三体世界。文字旁边放实时三体运动模拟。 */
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
          <ThreeBodyCanvas :size="480" />
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
