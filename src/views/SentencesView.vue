<script setup lang="ts">
/**
 * /sentences —— 全部 423 条。
 * 单栏引文流，分批追加。检索是纯前端 includes，不引索引库。
 * 命中不上高亮色：标记只加粗、改成主文字色，没有背景色。
 */
import { computed } from 'vue'
import SentenceStream from '@/components/SentenceStream.vue'
import RandomSentence from '@/components/RandomSentence.vue'
import { useSentences } from '@/composables/useSentences'

const { stats, loaded, failed, query, debounced, matched, visible, exhausted, more } =
  useSentences()

const countText = computed(() => {
  if (!loaded.value) return ''
  if (debounced.value) return `${matched.value.length} / ${stats.value?.total ?? 0} 条`
  return `${stats.value?.total ?? 0} 条`
})
</script>

<template>
  <main id="main" class="page">
    <div class="section wrap sv__head">
      <h1 class="title">书摘</h1>
      <p class="body measure sv__intro">
        站主从《三体》里抄下来的句子。长短差得很远，最短五个字，最长三百多字，
        所以它们在这里也占不一样大的地方。
      </p>

      <div class="sv__pick">
        <RandomSentence />
      </div>

      <div class="sv__search">
        <label class="fine sv__label" for="sv-q">搜句子</label>
        <input
          id="sv-q"
          v-model="query"
          class="sv__input"
          type="search"
          autocomplete="off"
          placeholder="输入一个词"
        />
        <p class="fine sv__count" aria-live="polite">{{ countText }}</p>
      </div>
    </div>

    <div class="section wrap sv__stream">
      <SentenceStream
        :items="visible"
        :highlight="debounced"
        :exhausted="exhausted"
        :loaded="loaded"
        :failed="failed"
        @more="more"
      />
    </div>
  </main>
</template>

<style scoped>
.sv__intro {
  margin-top: var(--s-4);
}

.sv__pick {
  margin-top: var(--s-6);
}

.sv__search {
  margin-top: var(--s-6);
  display: grid;
  gap: var(--s-2);
  max-width: 24em;
}

.sv__label {
  color: var(--ink-1);
}

/* 输入框：1px 描边和圆角写在同一个盒子上 */
.sv__input {
  width: 100%;
  padding: var(--s-2) var(--s-3);
  border: 1px solid var(--ink-2);
  border-radius: var(--r);
  background: var(--void);
  color: var(--ink-0);
  /* deslop-ignore-next-line 07 08 · 输入框里显示的是书摘检索词，跟正文同一套字 */
  font-family: var(--font-serif);
  font-size: var(--t-body);
  line-height: 1.6;
  transition: border-color var(--dur-hover) var(--ease);
}

.sv__input:hover,
.sv__input:focus {
  border-color: var(--ink-0);
}

.sv__input::placeholder {
  color: var(--ink-2);
}

.sv__count {
  color: var(--ink-1);
}

.sv__stream {
  padding-top: 0;
}
</style>
