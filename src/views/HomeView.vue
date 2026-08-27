<script setup lang="ts">
/**
 * 首页：单页长滚动，九个段落。
 * 段与段之间靠图片明暗节奏和大留白分隔，没有分割线，没有 section 底色变化。
 */
import SectionHero from '@/components/SectionHero.vue'
import SectionRedCoast from '@/components/SectionRedCoast.vue'
import SectionTrisolaris from '@/components/SectionTrisolaris.vue'
import SectionDarkForest from '@/components/SectionDarkForest.vue'
import SectionDroplet from '@/components/SectionDroplet.vue'
import SectionChronology from '@/components/SectionChronology.vue'
import SectionScale from '@/components/SectionScale.vue'
import SectionSentences from '@/components/SectionSentences.vue'
import SectionWorks from '@/components/SectionWorks.vue'
import SectionEnding from '@/components/SectionEnding.vue'
</script>

<template>
  <main id="main">
    <SectionHero />
    <SectionRedCoast />
    <SectionTrisolaris />
    <SectionDarkForest />
    <SectionDroplet />
    <SectionChronology />
    <SectionScale />
    <SectionSentences />
    <SectionWorks />
    <SectionEnding />
  </main>
</template>
