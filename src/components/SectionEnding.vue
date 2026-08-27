<script setup lang="ts">
/** 4.9 结尾。mini-universe 收尾：从最大尺度回到一间小屋、一株芽。 */
import Plate from './Plate.vue'
import RevealBlock from './RevealBlock.vue'
import { ENDING } from '@/content/concepts'
</script>

<template>
  <section class="end" aria-labelledby="end-title">
    <div class="section wrap end__body">
      <div class="end__split">
        <div class="end__figure">
          <Plate :plate="ENDING.plate" sizes="(max-width: 980px) 100vw, 520px" />
        </div>

        <div class="end__text">
          <RevealBlock as="h2" slow class="display end__title">
            <span id="end-title">{{ ENDING.title }}</span>
          </RevealBlock>
          <RevealBlock as="div" class="prose end__prose">
            <p v-for="(p, i) in ENDING.paragraphs" :key="i" class="body">{{ p }}</p>
          </RevealBlock>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.end__split {
  display: grid;
  gap: var(--s-5);
  grid-template-columns: minmax(0, 520px) minmax(0, 1fr);
  align-items: center;
}

.end__figure {
  margin: 0;
}

/* 「给岁月以文明」六个字，display 尺寸；正文离它 32，是一组 */
.end__title {
  font-size: clamp(32px, 6vw, 64px);
}

.end__prose {
  margin-top: var(--s-4);
  max-width: var(--measure-narrow);
}

@media (max-width: 980px) {
  .end__split {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
