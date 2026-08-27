<script setup lang="ts">
/** /about —— 这个站是什么、数据从哪来、版权怎么算。 */
import { SENTENCE_SOURCE } from '@/content/sentences'
import { RATING_SOURCE } from '@/content/works'
</script>

<template>
  <main id="main" class="section wrap about">
    <h1 class="title">关于</h1>

    <div class="prose measure about__body">
      <p class="body">
        Threebody.space 是一个粉丝站。站主读《三体》，也看《我的三体》系列动画，
        做这个站是想把这套书的世界观从头讲一遍，顺便把这些年抄下来的句子放在一个地方。
      </p>
      <p class="body">
        站内正文包含全书关键情节：黑暗森林法则、水滴、二向箔、程心的两次选择都会讲到。
        没读过书又不想被剧透的话，这里不适合先看。
      </p>

      <h2 class="about__h2">数据</h2>
      <p class="body">
        书摘共 423 条，整理自站主自己的仓库
        <a :href="SENTENCE_SOURCE" rel="noopener noreferrer" target="_blank">
          AyagawaSeirin/ThreebodySpace
        </a>
        。清洗脚本只做了格式规整：拆分行、统一标点、去掉三条完全重复的，
        没有增加原数据里没有的信息。
      </p>
      <p class="body">
        有几条在源头就是截断的，末尾话没说完。这里原样展示，没有补全，也没有加省略标记。
      </p>
      <p class="body">
        绝大多数句子在原数据里没有出处信息，所以它们下面什么都不写——
        不标「刘慈欣」，也不标是第几部第几章。空着比猜着对。
      </p>
      <p class="body">
        《我的三体》四季的集数、播出与完结日期取自公开报道；
        {{ RATING_SOURCE.text }}，查询日期 {{ RATING_SOURCE.checkedOn }}。
        播放量、粉丝数、制作费用这类查不到确切出处的数字，站内一个都没有。
      </p>

      <h2 class="about__h2">图片</h2>
      <p class="body">
        站内所有图像都是为这个站单独生成的，不是影视截图，也不是他人作品。
        体素风那张是原创致敬，不来自任何一集动画。
      </p>

      <h2 class="about__h2">版权</h2>
      <p class="body">
        本站为粉丝二创，非官方。《三体》著作权归刘慈欣；
        《我的三体》系列相关权利归其权利人。本站不托管、不内嵌任何影片，
        动画只提供官方平台外链。侵权或勘误请联系站主。
      </p>
    </div>
  </main>
</template>

<style scoped>
.about__body {
  margin-top: var(--s-5);
}

/* 小标题和它下面的段落是一组：离上一段远（64），离自己的正文近（16）。
   .prose 给 p+p 上了 32 的间距，这里把小标题后那一段的 32 收回来再给 16。 */
.about__h2 {
  margin-top: var(--s-5);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--t-lead);
  line-height: 1.4;
}

.about__h2 + p {
  margin-top: var(--s-3);
}
</style>
