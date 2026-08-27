<script setup lang="ts">
/**
 * 4.1 开场。满屏 hero-void，左半边黑区叠标题。
 * 动效只有两个：星点错峰淡入 1.2s（图整体 opacity），标题延后 400ms 淡入并上移 12px。
 * 没有滚动提示箭头的弹跳——只有一条 1px 竖线在呼吸。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Plate from './Plate.vue'
import { HERO } from '@/content/concepts'

const lit = ref(false)
const titled = ref(false)

/**
 * 三颗星在素材的 x 65%–80% 处，左半边是留给标题的空场。
 * 宽屏能装下整幅，居中即可；窄屏 cover 会从两侧裁，
 * 取景必须往右推，否则星星被切掉——开场就只剩一块黑。
 */
const narrow = ref(false)
function syncNarrow() {
  narrow.value = window.matchMedia('(max-width: 720px)').matches
}
const heroPosition = computed(() => (narrow.value ? '76% 42%' : '58% center'))

onMounted(() => {
  syncNarrow()
  window.addEventListener('resize', syncNarrow, { passive: true })
  requestAnimationFrame(() => {
    lit.value = true
  })
  window.setTimeout(() => {
    titled.value = true
  }, 400)
})

onBeforeUnmount(() => window.removeEventListener('resize', syncNarrow))
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__plate" :class="{ 'is-lit': lit }">
      <Plate :plate="HERO.plate" :position="heroPosition" priority full />
    </div>

    <div class="hero__over">
      <div class="hero__text" :class="{ 'is-in': titled }">
        <h1 id="hero-title" class="display hero__title">{{ HERO.title }}</h1>
        <p class="hero__standfirst">{{ HERO.standfirst }}</p>
        <p class="fine hero__spoiler">{{ HERO.spoiler }}</p>
      </div>
    </div>

    <div class="hero__tick" aria-hidden="true"></div>
  </section>
</template>

<style scoped>
.hero {
  --hero-h: calc(100svh - var(--header-h, 0px));

  position: relative;
  display: grid;
  /*
    开场排在页头下面，所以「一屏」不是 100svh，而是 100svh 减掉页头的高度——
    直接用 100svh 的话，整个开场都会往下溢出一个页头，最后两行文字掉到屏幕外。
    页头高度由 App.vue 量出来写进 --header-h（内容会换行，写死不可靠）。
  */
  grid-template-rows: var(--hero-h);
  min-height: var(--hero-h);
}

/* 星点淡入：图整体 0 → 1，1.2s。素材上三颗星本身亮度不同，
   错峰感来自它们不同的亮度到达可见阈值的时间不同，不需要拆成三个元素。 */
.hero__plate {
  grid-area: 1 / 1;
  opacity: 0;
  transition: opacity 1200ms var(--ease);
}

.hero__plate.is-lit {
  opacity: 1;
}

.hero__plate,
.hero__plate :deep(picture),
.hero__plate :deep(.plate__img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* object-position 由 heroPosition 按屏宽给（内联样式），不在这里写死 */
}

.hero__over {
  grid-area: 1 / 1;
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  padding: var(--s-5) var(--s-4);
  /* 内容比一屏还高时（小屏 + 大字），让它自己滚，而不是溢出到图外 */
  overflow: hidden;
}

/* 标题压在左半边——素材左半边是纯黑的空场，白字直接落上去，不加蒙版 */
.hero__text {
  max-width: 30em;
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity var(--dur-reveal-slow) var(--ease),
    transform var(--dur-reveal-slow) var(--ease);
}

.hero__text.is-in {
  opacity: 1;
  transform: none;
}

.hero__standfirst {
  margin-top: var(--s-4);
  max-width: 26em;
  color: var(--ink-1);
}

.hero__spoiler {
  margin-top: var(--s-3);
}

/* 滚动提示：一条 1px 竖线，opacity 呼吸。没有箭头，没有上下弹跳。 */
.hero__tick {
  position: absolute;
  left: 50%;
  bottom: var(--s-4);
  width: 1px;
  height: 48px;
  background: var(--ink-2);
  animation: tick-breathe 3.2s var(--ease) infinite;
}

@keyframes tick-breathe {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
}

@media (max-width: 720px) {
  .hero__title {
    letter-spacing: 0.04em;
  }

  /*
    竖屏：上半留给星空，文字整块贴在下面。
    用两行网格而不是 padding 顶：第二行按内容取高（auto），
    第一行吃掉剩下的（1fr），所以文字块无论多高都完整留在一屏内——
    padding 是固定值，屏一矮就把最后两行顶出去了（375×667 溢出 41px）。
  */
  .hero__over {
    grid-template-rows: minmax(0, 1fr) auto;
    align-content: stretch;
    padding-bottom: var(--s-4);
  }

  .hero__text {
    grid-row: 2;
    align-self: end;
  }

  .hero__standfirst {
    margin-top: var(--s-3);
  }

  .hero__spoiler {
    margin-top: var(--s-2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__plate,
  .hero__text {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .hero__tick {
    animation: none;
    opacity: 0.5;
  }
}
</style>
