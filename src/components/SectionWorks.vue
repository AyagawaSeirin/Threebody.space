<script setup lang="ts">
/**
 * 4.8 《我的三体》。竖排年表：2014 / 2016 / 2020 / 2024。
 * 年份用等宽大字（真数据，允许显眼），左侧一条 1px 竖线串起来。
 * 不用卡片，不用圆角框——只有缩进和那条线。
 */
import Plate from './Plate.vue'
import RevealBlock from './RevealBlock.vue'
import {
  DIRECTOR,
  DISBANDED,
  RANK_FACT,
  RATING_SOURCE,
  SEASONS,
} from '@/content/works'
import { WORKS_SECTION } from '@/content/concepts'
</script>

<template>
  <section class="works" aria-labelledby="works-title">
    <div class="frame">
      <Plate :plate="WORKS_SECTION.plate" sizes="100vw" />
    </div>

    <div class="section wrap">
      <RevealBlock as="h2" class="title">
        <span id="works-title">{{ WORKS_SECTION.title }}</span>
      </RevealBlock>

      <RevealBlock as="div" class="prose measure works__intro">
        <p class="body">{{ WORKS_SECTION.intro }}</p>
        <p class="body">
          导演{{ DIRECTOR.alias }}，本名{{ DIRECTOR.name }}。{{ DIRECTOR.intro }}
        </p>
      </RevealBlock>

      <!-- 年表：左侧 1px 竖线贯穿，年份挂在线上 -->
      <ol class="tl">
        <RevealBlock v-for="s in SEASONS" :key="s.year" as="li" class="tl__item">
          <p class="data tl__year">{{ s.year }}</p>
          <div class="tl__body">
            <h3 class="tl__title">{{ s.title }}</h3>
            <p class="fine tl__meta">
              {{ s.episodes }} ·
              <time :datetime="s.premiere">{{ s.premiereText }}</time> 开播 ·
              <time :datetime="s.finale">{{ s.finaleText }}</time> 完结
            </p>
            <p class="fine tl__meta">{{ s.adapts }}</p>
            <p v-if="s.credits" class="fine tl__meta">{{ s.credits }}</p>
            <p v-if="s.theme" class="fine tl__meta">
              主题曲《{{ s.theme.title }}》，{{ s.theme.by }}
            </p>
            <p v-if="s.ratings" class="fine tl__meta">
              <span v-for="(r, i) in s.ratings" :key="r.site">
                <template v-if="i > 0"> · </template>{{ r.site }}
                <span class="data">{{ r.score }}</span>
              </span>
            </p>
            <p class="body tl__note">{{ s.note }}</p>
          </div>
        </RevealBlock>
      </ol>

      <RevealBlock as="div" class="works__facts">
        <p class="body measure">{{ RANK_FACT }}</p>
        <p class="fine works__source">
          {{ RATING_SOURCE.text }}，查询日期 {{ RATING_SOURCE.checkedOn }}。
        </p>
      </RevealBlock>
    </div>

    <!-- 情感落点：单独一段，前后 160px 留白，不加装饰，不用红色，不煽情。 -->
    <div class="section wrap works__end">
      <RevealBlock as="p" class="lead">{{ DISBANDED }}</RevealBlock>
    </div>
  </section>
</template>

<style scoped>
.works__intro {
  margin-top: var(--s-4);
}

/* 一条 1px 竖线把四季串起来。线画在 ol 上，不给每一项加边框。 */
.tl {
  position: relative;
  margin-top: var(--s-6);
  padding-left: var(--s-4);
}

.tl::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--s-1);
  bottom: var(--s-1);
  width: 1px;
  background: var(--ink-2);
}

/* 季与季之间 64（同一序列内），比它到上一节的 160 明显近 */
.tl__item + .tl__item {
  margin-top: var(--s-5);
}

.tl__year {
  font-size: var(--t-title);
  line-height: 1;
  color: var(--ink-0);
}

/* 年份和它的内容是一组，靠得近 */
.tl__body {
  margin-top: var(--s-3);
  max-width: var(--measure);
}

.tl__title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--t-lead);
  line-height: 1.4;
}

.tl__meta {
  margin-top: var(--s-1);
}

.tl__note {
  margin-top: var(--s-3);
}

.works__facts {
  margin-top: var(--s-6);
}

.works__source {
  margin-top: var(--s-3);
}

.works__end {
  padding-top: var(--s-6);
  padding-bottom: var(--s-6);
}
</style>
