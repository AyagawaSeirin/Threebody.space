<script setup lang="ts">
/**
 * 随机一句 + 「换一句」。
 * 理由：这是粉丝站，「随手翻到一句」是真实的使用场景。
 *
 * 换句只做 opacity 交叉淡入淡出，180ms。不翻转、不滑动、不打字机。
 * 这个按钮是全站唯一的交互按钮，纯文字 + 1px 下边框，不是 pill。
 */
import { onBeforeUnmount, ref } from 'vue'
import { loadSentences, type Sentence } from '@/content/sentences'
import { pickDisplay } from '@/composables/useSentences'

const current = ref<Sentence | null>(null)
const pool = ref<Sentence[]>([])
const visible = ref(false)
let timer = 0

loadSentences()
  .then((file) => {
    pool.value = file.sentences
    current.value = pickDisplay(file.sentences)
    visible.value = true
  })
  .catch(() => {
    /* 拿不到就不显示这一块，不放占位插画，不报错给用户看 */
  })

function shuffle() {
  if (!pool.value.length) return
  visible.value = false
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    current.value = pickDisplay(pool.value, current.value?.id)
    visible.value = true
  }, 180)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div v-if="current" class="pick">
    <blockquote class="pick__text" :class="{ 'is-in': visible }">
      <p v-for="(line, i) in current.lines" :key="i">{{ line }}</p>
    </blockquote>
    <p v-if="current.attribution" class="fine pick__by" :class="{ 'is-in': visible }">
      —— {{ current.attribution }}
    </p>
    <button type="button" class="text-button pick__button" @click="shuffle">换一句</button>
  </div>
</template>

<style scoped>
.pick__text {
  margin: 0;
  max-width: 24em;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(24px, 4vw, 40px);
  line-height: 1.32;
  opacity: 0;
  transition: opacity 180ms var(--ease);
}

.pick__text.is-in,
.pick__by.is-in {
  opacity: 1;
}

.pick__by {
  margin-top: var(--s-3);
  max-width: 24em;
  text-align: right;
  opacity: 0;
  transition: opacity 180ms var(--ease);
}

.pick__button {
  margin-top: var(--s-4);
}
</style>
