<script setup lang="ts">
/**
 * 4.2 红岸。全站的 --signal 红只用在这一节的两个地方：
 * 天线桅杆上那盏灯的位置一个 6px 实心方点，和「1971」这个年份。
 *
 * 「不要回答」用 display 尺寸、白色，不是红色：
 * 红色代表「人类把信号发出去」这个不可撤回的动作，
 * 警告是对方发来的，不属于这个含义，所以它留白。
 */
import Plate from './Plate.vue'
import RevealBlock from './RevealBlock.vue'
import { useCoverBox } from '@/composables/useCoverBox'
import { RED_COAST } from '@/content/concepts'

// 红灯在素材里的位置由像素实测得出：红色像素簇质心在 72.47% / 36.53%。
// 图片被 cover 裁过，所以要把图片坐标换算成容器坐标。
const { host, at } = useCoverBox(RED_COAST.plate)
const lamp = at(72.47, 36.53)
</script>

<template>
  <section class="coast" aria-labelledby="coast-title">
    <figure ref="host" class="frame">
      <Plate :plate="RED_COAST.plate" sizes="100vw" />
      <!-- 6px 实心方点，压在素材里红灯的位置。没有光晕，没有脉冲。 -->
      <span class="coast__lamp" :style="lamp" aria-hidden="true"></span>
    </figure>

    <div class="section wrap coast__body">
      <RevealBlock as="div">
        <p class="data coast__year">{{ RED_COAST.year }}</p>
        <h2 id="coast-title" class="title coast__title">{{ RED_COAST.title }}</h2>
      </RevealBlock>

      <RevealBlock as="div" class="prose measure coast__prose">
        <p v-for="(p, i) in RED_COAST.paragraphs" :key="i" class="body">{{ p }}</p>
      </RevealBlock>

      <RevealBlock as="p" slow class="display coast__reply">
        {{ RED_COAST.reply }}
      </RevealBlock>
    </div>
  </section>
</template>

<style scoped>
.coast__lamp {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--signal);
  /* 方点的中心落在灯上 */
  transform: translate(-50%, -50%);
}

.coast__year {
  font-size: var(--t-title);
  line-height: 1;
  color: var(--signal);
}

/* 年份和它下面的标题是一组，靠得近（16）；正文另起一组（64） */
.coast__title {
  margin-top: var(--s-3);
}

.coast__prose {
  margin-top: var(--s-5);
}

/* 「不要回答」独占一片黑：上下 160，白色，display 尺寸 */
.coast__reply {
  margin-top: var(--s-6);
  margin-bottom: var(--s-4);
}
</style>
