<script setup lang="ts">
/**
 * 页头的高度会随屏宽变（导航在窄屏可能换行），而开场是紧跟它的一整屏。
 * 把实测高度写进 --header-h，开场用 calc(100svh - var(--header-h)) 取高，
 * 否则首屏会整体往下溢出一个页头，最后两行文字掉到屏幕外。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'

const header = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

function publishHeight() {
  const el = header.value
  if (!el) return
  document.documentElement.style.setProperty(
    '--header-h',
    `${Math.round(el.getBoundingClientRect().height)}px`,
  )
}

onMounted(() => {
  publishHeight()
  if (typeof ResizeObserver !== 'undefined' && header.value) {
    ro = new ResizeObserver(publishHeight)
    ro.observe(header.value)
  } else {
    window.addEventListener('resize', publishHeight, { passive: true })
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', publishHeight)
})
</script>

<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <div ref="header">
    <SiteNav />
  </div>
  <RouterView />
  <SiteFooter />
</template>
