<script setup lang="ts">
/**
 * giscus 留言区。
 *
 * 不使用额外的 Vue 包：giscus 官方脚本本身会创建 iframe，组件只负责在页面
 * 挂载时插入脚本、离开页面时清理。留言统一写入仓库 Discussions 的 General 分类。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const REPO = 'AyagawaSeirin/Threebody.space'
const REPO_ID = 'R_kgDOUF3P5w'
const CATEGORY = 'General'
const CATEGORY_ID = 'DIC_kwDOUF3P584DEg15'

const comments = ref<HTMLElement | null>(null)

onMounted(() => {
  const host = comments.value
  if (!host) return

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', REPO)
  script.setAttribute('data-repo-id', REPO_ID)
  script.setAttribute('data-category', CATEGORY)
  script.setAttribute('data-category-id', CATEGORY_ID)
  script.setAttribute('data-mapping', 'specific')
  script.setAttribute('data-term', '留言板')
  script.setAttribute('data-strict', '1')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'top')
  script.setAttribute('data-theme', 'transparent_dark')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  host.appendChild(script)
})

onBeforeUnmount(() => {
  comments.value?.replaceChildren()
})
</script>

<template>
  <div ref="comments" class="comments">
    <noscript>
      <p class="fine">
        留言区需要 JavaScript。也可以直接前往
        <a
          href="https://github.com/AyagawaSeirin/Threebody.space/discussions"
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub Discussions
        </a>
        留言。
      </p>
    </noscript>
  </div>
</template>

<style scoped>
.comments {
  width: 100%;
  min-height: 240px;
}

.comments :deep(.giscus),
.comments :deep(.giscus-frame) {
  width: 100%;
}
</style>
