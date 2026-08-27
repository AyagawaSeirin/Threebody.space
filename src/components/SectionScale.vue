<script setup lang="ts">
/** 4.6 尺度。纯排版，不配图。 */
import RevealBlock from './RevealBlock.vue'
import ScaleRuler from './ScaleRuler.vue'
import { SCALE_SECTION } from '@/content/concepts'
</script>

<template>
  <section class="section wrap scale" aria-labelledby="scale-title">
    <RevealBlock as="h2" class="title">
      <span id="scale-title">{{ SCALE_SECTION.title }}</span>
    </RevealBlock>

    <RevealBlock as="p" class="body measure scale__intro">
      {{ SCALE_SECTION.intro }}
    </RevealBlock>

    <div class="scale__ruler">
      <ScaleRuler />
    </div>

    <p class="fine scale__hint">{{ SCALE_SECTION.hint }}</p>
  </section>
</template>

<style scoped>
.scale__intro {
  margin-top: var(--s-4);
}

.scale__ruler {
  margin-top: var(--s-5);
}

.scale__hint {
  margin-top: var(--s-4);
}
</style>
