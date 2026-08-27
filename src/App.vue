<script setup lang="ts">
/**
 * 页头的高度会随屏宽变（导航在窄屏可能换行），而开场是紧跟它的一整屏。
 * 把实测高度写进 --header-h，开场用 calc(100svh - var(--header-h)) 取高，
 * 否则首屏会整体往下溢出一个页头，最后两行文字掉出屏幕。
 *
 * /simulation 是满屏画布，不套页头页脚：那一页的内容就是整个视口，
 * 挤进一个导航和三行页脚只会把运动压到上半屏。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'

const route = useRoute()
const bare = computed(() => route.meta.bare === true)

const header = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

function publishHeight() {
  const el = header.value
  if (!el) {
    document.documentElement.style.setProperty('--header-h', '0px')
    return
  }
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
  <a v-if="!bare" class="skip-link" href="#main">跳到正文</a>
  <div v-if="!bare" ref="header">
    <SiteNav />
  </div>
  <RouterView />
  <SiteFooter v-if="!bare" />
</template>
