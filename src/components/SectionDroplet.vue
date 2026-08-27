<script setup lang="ts">
/**
 * 4.5 水滴与降维。两张图挨着放，中间大留白。
 *
 * 水滴那张随滚动进度 scale 1.0 → 1.04：
 * 全站只有这一处用位移，因为「逼近」在这一段是有含义的——
 * 水滴就是朝着舰队一点点靠过来的。
 */
import { computed } from 'vue'
import Plate from './Plate.vue'
import RevealBlock from './RevealBlock.vue'
import { useScrollProgress } from '@/composables/useScrollProgress'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { DIMENSION, DROPLET } from '@/content/concepts'

const { el, progress } = useScrollProgress()
const reduced = useReducedMotion()

// 只在 0.15–0.85 这段里推进，两头留住，避免刚进视口就已经放大了
const scale = computed(() => {
  if (reduced.value) return 1
  const t = Math.min(1, Math.max(0, (progress.value - 0.15) / 0.7))
  return 1 + t * 0.04
})
</script>

<template>
  <section class="drop" aria-labelledby="drop-title">
    <div class="section wrap">
      <RevealBlock as="h2" class="title">
        <span id="drop-title">{{ DROPLET.title }}</span>
      </RevealBlock>

      <div class="drop__split">
        <RevealBlock as="div" class="prose drop__prose">
          <p v-for="(p, i) in DROPLET.paragraphs" :key="i" class="body">{{ p }}</p>
        </RevealBlock>

        <div ref="el" class="drop__frame">
          <div class="drop__zoom" :style="{ transform: `scale(${scale})` }">
            <Plate :plate="DROPLET.plate" sizes="(max-width: 980px) 100vw, 520px" />
          </div>
        </div>
      </div>
    </div>

    <!-- 两张图之间大留白：--s-6 上下各一次 -->
    <div class="section wrap dim">
      <RevealBlock as="h2" class="title">
        <span id="dim-title">{{ DIMENSION.title }}</span>
      </RevealBlock>

      <RevealBlock as="div" class="prose measure dim__prose">
        <p v-for="(p, i) in DIMENSION.paragraphs" :key="i" class="body">{{ p }}</p>
      </RevealBlock>
    </div>

    <div class="frame">
      <Plate :plate="DIMENSION.plate" sizes="100vw" />
    </div>
  </section>
</template>

<style scoped>
.drop__split {
  margin-top: var(--s-4);
  display: grid;
  gap: var(--s-5);
  grid-template-columns: minmax(0, 1fr) minmax(0, 520px);
  align-items: start;
}

.drop__prose {
  max-width: var(--measure-narrow);
}

/* 裁剪框：放大时不让图溢出去推动布局。
   这个盒子不圆角（--r 只有 2px，配合 overflow 也不会出现被裁掉的描边），
   而且它本身没有 border——描边和圆角不在两个盒子上打架。 */
.drop__frame {
  overflow: hidden;
  line-height: 0;
}

.drop__zoom {
  transform-origin: center;
  will-change: transform;
}

.dim__prose {
  margin-top: var(--s-4);
}

@media (max-width: 980px) {
  .drop__split {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .drop__zoom {
    transform: none !important;
  }
}
</style>
