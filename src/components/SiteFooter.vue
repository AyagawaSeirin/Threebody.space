<script setup lang="ts">
/**
 * 页脚。一行小字，不做三列 footer。
 * 版权说明必须写清楚：本站是粉丝二创，非官方；著作权归属。
 * 书摘出处在 /about 里交代（含仓库链接与清洗说明），这里不再重复一遍。
 */
const OWNER_URL = 'https://seir.in'
const REPO_URL = 'https://github.com/AyagawaSeirin/Threebody.space'
</script>

<template>
  <footer class="foot">
    <div class="wrap">
      <p class="fine foot__line">
        Threebody.space · 站主
        <a :href="OWNER_URL" rel="noopener noreferrer" target="_blank">綾川星凛</a>
        · 本站为粉丝二创，非官方 ·
        <a :href="REPO_URL" rel="noopener noreferrer" target="_blank">源码</a>
      </p>
      <p class="fine foot__line">
        《三体》著作权归刘慈欣；《我的三体》系列相关权利归其权利人。本站不托管、不内嵌任何影片，
        动画只提供官方平台外链。
      </p>
      <p class="fine foot__line">侵权或勘误请联系站主。</p>
    </div>
  </footer>
</template>

<style scoped>
.foot {
  padding: var(--s-6) var(--s-4) var(--s-5);
}

.foot__line {
  max-width: 52em;
  color: var(--ink-1);
}

.foot__line + .foot__line {
  margin-top: var(--s-3);
}
</style>
