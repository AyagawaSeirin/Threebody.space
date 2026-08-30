<script setup lang="ts">
/**
 * 站点标记与导航。
 * 标记 = 一条真算出来的 8 字轨道 + 「三体宇宙」四字（见 SiteMark.vue）。
 * 导航是五条纯文字链接，没有 pill，没有背景色。
 */
import { RouterLink } from 'vue-router'
import SiteMark from './SiteMark.vue'
</script>

<template>
  <header class="nav">
    <div class="nav__inner">
      <RouterLink to="/" class="nav__mark">
        <SiteMark :size="26" class="nav__mark-glyph" title="三体：8 字形三体轨道" />
        <span class="nav__mark-cn">三体宇宙</span>
        <span class="nav__mark-domain">Threebody.space</span>
      </RouterLink>

      <nav class="nav__links" aria-label="站内导航">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/sentences">书摘</RouterLink>
        <RouterLink to="/works">我的三体</RouterLink>
        <RouterLink to="/guestbook">留言</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: relative;
  z-index: 2;
}

.nav__inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-4);
  flex-wrap: wrap;
}

.nav__mark {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  border: 0;
  color: var(--ink-0);
}

/* 轨道随 hover 整体提亮一点，只改 opacity */
.nav__mark-glyph {
  flex: none;
  opacity: 0.85;
  transition: opacity var(--dur-hover) var(--ease);
}

.nav__mark:hover .nav__mark-glyph {
  opacity: 1;
}

.nav__mark-cn {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--t-lead);
  letter-spacing: 0.08em;
  color: var(--ink-0);
}

.nav__mark-domain {
  /* 域名是站点标记的一部分，属于 UI chrome，不是年份坐标那类数据，
     所以不用等宽（等宽只留给真数据）。 */
  font-family: var(--font-sans);
  font-size: var(--t-fine);
  letter-spacing: 0.02em;
  color: var(--ink-1);
}

.nav__links {
  display: flex;
  gap: var(--s-4);
  font-family: var(--font-sans);
  font-size: var(--t-fine);
}

.nav__links a {
  border-bottom-color: transparent;
  color: var(--ink-1);
}

.nav__links a:hover {
  color: var(--ink-0);
  border-bottom-color: var(--ink-0);
}

/* 当前页：靠颜色和一条下边框标记，不用背景块 */
.nav__links a.router-link-exact-active {
  color: var(--ink-0);
  border-bottom-color: var(--ink-2);
}

@media (max-width: 560px) {
  /* 窄屏：标记和导航排成一行，别换行。
     换行会让页头从 106px 长到 160px，而开场是紧跟其后的一整屏，
     首屏就被顶掉一个页头的高度，最后两行文字掉到屏幕外。 */
  .nav__inner {
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--s-3);
    padding: var(--s-3);
  }

  .nav__mark-domain {
    /* 域名在窄屏让位给导航，标记只留「三体宇宙」四个字 */
    display: none;
  }

  .nav__links {
    gap: var(--s-2);
  }
}

@media (max-width: 400px) {
  /* 加入第五个入口后，极窄屏只收起图形标记，站名与全部导航仍完整保留。 */
  .nav__mark-glyph {
    display: none;
  }
}
</style>
