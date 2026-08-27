<script setup lang="ts">
/** /works —— 《我的三体》专页。年表与首页同一份数据，这里多给外链。 */
import SectionWorks from '@/components/SectionWorks.vue'
import { OFFICIAL_LINKS } from '@/content/works'
</script>

<template>
  <main id="main">
    <SectionWorks />

    <section class="section wrap links" aria-labelledby="links-title">
      <h2 id="links-title" class="title">在哪看</h2>
      <p class="body measure links__intro">
        只给官方平台的外链。本站不托管、不内嵌任何影片。
      </p>
      <ul class="links__list">
        <li v-for="l in OFFICIAL_LINKS" :key="l.href" class="links__item">
          <a :href="l.href" rel="noopener noreferrer" target="_blank">{{ l.label }}</a>
          <span v-if="l.note" class="fine links__note">{{ l.note }}</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.links__intro {
  margin-top: var(--s-4);
}

.links__list {
  margin-top: var(--s-5);
}

/* 列表就是列表：靠对齐和间距，不给每一项套框 */
.links__item {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  font-family: var(--font-sans);
  font-size: var(--t-fine);
}

.links__item + .links__item {
  margin-top: var(--s-3);
}

.links__note {
  color: var(--ink-1);
}
</style>
