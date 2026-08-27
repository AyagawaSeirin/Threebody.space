<script setup lang="ts">
/**
 * 图片板。AVIF → WebP → JPG 三级回退。
 * 素材本身就是深空黑，不加任何暗色遮罩渐变层，白字直接叠。
 */
import { computed } from 'vue'
import type { Plate } from '@/content/concepts'
import { imageSrc } from '@/content/assets'

const props = withDefaults(
  defineProps<{
    plate: Plate
    /** 首屏 LCP 图给 eager + high，其余懒加载 */
    priority?: boolean
    /** 满屏铺满（开场用） */
    full?: boolean
    sizes?: string
    /**
     * 完整覆盖 object-position。开场那张图的横向取景要按屏宽变，
     * 而 focus 只管纵向；给它一个整体接口，避免和内联样式打架。
     */
    position?: string
  }>(),
  { priority: false, full: false, sizes: '100vw', position: undefined },
)

const src = (ext: 'avif' | 'webp' | 'jpg') => imageSrc(props.plate.name, ext)

// 每张图自己决定被裁掉的是哪一段，见 Plate.focus
const objectPosition = computed(
  () => props.position ?? `50% ${props.plate.focus ?? 'center'}`,
)
</script>

<template>
  <picture>
    <source :srcset="src('avif')" :sizes="sizes" type="image/avif" />
    <source :srcset="src('webp')" :sizes="sizes" type="image/webp" />
    <img
      class="plate__img"
      :src="src('jpg')"
      :alt="plate.alt"
      :width="plate.width"
      :height="plate.height"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      :data-full="full ? '' : undefined"
      :style="{ objectPosition }"
    />
  </picture>
</template>
