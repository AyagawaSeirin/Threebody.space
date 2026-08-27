<script setup lang="ts">
/** 4.7 首页的书摘入口：随机一句 + 精选几条 + 去全集的链接。 */
import { RouterLink } from 'vue-router'
import RevealBlock from './RevealBlock.vue'
import RandomSentence from './RandomSentence.vue'
import { SENTENCES_SECTION } from '@/content/concepts'
</script>

<template>
  <section class="section wrap sent" aria-labelledby="sent-title">
    <RevealBlock as="h2" class="title">
      <span id="sent-title">{{ SENTENCES_SECTION.title }}</span>
    </RevealBlock>

    <RevealBlock as="p" class="body measure sent__intro">
      {{ SENTENCES_SECTION.intro }}
    </RevealBlock>

    <div class="sent__pick">
      <RandomSentence />
    </div>

    <p class="sent__link">
      <RouterLink to="/sentences">{{ SENTENCES_SECTION.linkText }}</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.sent__intro {
  margin-top: var(--s-4);
}

.sent__pick {
  margin-top: var(--s-6);
}

.sent__link {
  margin-top: var(--s-6);
  font-family: var(--font-sans);
  font-size: var(--t-fine);
}
</style>
