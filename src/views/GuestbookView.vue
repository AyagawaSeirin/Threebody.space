<script setup lang="ts">
/** /guestbook —— 使用 GitHub Discussions 承载的公开留言板。 */
import GiscusComments from '@/components/GiscusComments.vue'
</script>

<template>
  <main id="main" class="section wrap guestbook">
    <header class="guestbook__head measure">
      <h1 class="title">留言板</h1>
      <p class="body guestbook__intro">
        想聊聊《三体》、这个站，或者发现了错字和遗漏，都可以写在这里。
        留言由 GitHub Discussions 保存，发布时需要登录 GitHub。
      </p>
    </header>

    <section class="guestbook__comments" aria-label="留言">
      <GiscusComments />
    </section>
  </main>
</template>

<style scoped>
.guestbook__intro {
  margin-top: var(--s-4);
  color: var(--ink-1);
}

.guestbook__comments {
  max-width: 880px;
  margin-top: var(--s-5);
}
</style>
