<script setup lang="ts">
/**
 * 进视口淡入 + 8px 上移。全站唯一的进场动效。
 * 每个块独立触发，不做逐条 stagger 叠加。
 */
import { useReveal } from '@/composables/useReveal'

withDefaults(defineProps<{ slow?: boolean; as?: string }>(), { slow: false, as: 'div' })
const { el, shown } = useReveal()
</script>

<template>
  <component
    :is="as"
    ref="el"
    class="reveal"
    :class="{ 'reveal--slow': slow, 'is-in': shown }"
  >
    <slot />
  </component>
</template>
