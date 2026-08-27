<script setup lang="ts">
/**
 * 4.4 黑暗森林。
 * 动效：滚动进入时素材里那根更亮的光针再亮一点点（0.6 → 1，2s），其余不动。
 * 做法是在那根针的位置叠一个极窄的白色竖条，只改 opacity。
 * 一个细节动一下，比整屏动更有力。
 */
import { computed } from 'vue'
import Plate from './Plate.vue'
import RevealBlock from './RevealBlock.vue'
import { useReveal } from '@/composables/useReveal'
import { useCoverBox } from '@/composables/useCoverBox'
import { DARK_FOREST } from '@/content/concepts'

const { el, shown } = useReveal({ threshold: 0.35 })

// 最亮那根针的位置由像素实测得出：列亮度峰值在 x=33.07%，整根从 y 11% 延到 88%。
// 图片被 cover 裁过，位置和长度都要跟着换算。
const { host, at, spanY } = useCoverBox(DARK_FOREST.plate)
const needlePos = at(33.07, 11)
const needleHeight = spanY(77)
const needle = computed(() => ({ ...needlePos.value, height: needleHeight.value }))
</script>

<template>
  <section class="forest" aria-labelledby="forest-title">
    <figure ref="host" class="frame">
      <span ref="el" class="forest__probe" aria-hidden="true"></span>
      <Plate :plate="DARK_FOREST.plate" sizes="100vw" />
      <span
        class="forest__needle"
        :class="{ 'is-lit': shown }"
        :style="needle"
        aria-hidden="true"
      ></span>
    </figure>

    <div class="section wrap">
      <RevealBlock as="h2" class="title">
        <span id="forest-title">{{ DARK_FOREST.title }}</span>
      </RevealBlock>

      <RevealBlock as="ol" class="axioms">
        <li v-for="a in DARK_FOREST.axioms" :key="a.n" class="axiom">
          <span class="fine axiom__n">公理{{ a.n }}</span>
          <p class="lead axiom__text">{{ a.text }}</p>
        </li>
      </RevealBlock>

      <RevealBlock as="div" class="prose measure forest__prose">
        <p v-for="(p, i) in DARK_FOREST.paragraphs" :key="i" class="body">{{ p }}</p>
      </RevealBlock>
    </div>
  </section>
</template>

<style scoped>
/* 观察点：铺满取景框，用来判断这张图进没进视口 */
.forest__probe {
  position: absolute;
  inset: 0;
}

.forest__needle {
  position: absolute;
  width: 2px;
  /* 这是那根光针本身的形状：素材里的光柱两端是渐隐的，补亮的线必须跟着渐隐，
     否则端点会和原图硬切出两个亮点。不是氛围打光，也不是卡片表面渐变。 */
  /* deslop-ignore-next-line 06 */
  background: linear-gradient(to bottom, transparent, var(--ink-0) 12%, var(--ink-0) 88%, transparent);
  transform: translateX(-50%);
  opacity: 0.6;
  transition: opacity 2000ms var(--ease);
}

.forest__needle.is-lit {
  opacity: 1;
}

/* 两条公理是有编号的真序列（原著就叫公理一、公理二），不是装饰性序号。
   靠缩进和字号区分，不用卡片，不用左边框。 */
.axioms {
  margin-top: var(--s-4);
  max-width: var(--measure);
}

.axiom + .axiom {
  margin-top: var(--s-4);
}

.axiom__n {
  display: block;
  color: var(--ink-1);
}

.axiom__text {
  margin-top: var(--s-2);
}

.forest__prose {
  margin-top: var(--s-5);
}

@media (prefers-reduced-motion: reduce) {
  /* 减弱动态效果时不做那 2s 的补亮，直接给足亮度 */
  .forest__needle {
    opacity: 1;
    transition: none;
  }
}
</style>
