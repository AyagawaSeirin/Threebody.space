<script setup lang="ts">
/**
 * 4.6 宇宙尺度尺。一条对数轴，从人体尺度到可观测宇宙。
 *
 * 这一段不配图，纯排版：黑底、1px 白线、等宽标签。
 * 全站只有这里允许数字很大很显眼，因为它们是真实物理量，不是编的 KPI。
 *
 * 两种驱动方式：
 * 1. 页面滚动。没碰过尺子时，游标跟着这一节穿过视口的进度走——
 *    滚动本身就在推进尺度，数字连续跳变。
 * 2. 拖动 / 方向键 / 点锚点。一旦手动操作过，就交给用户，不再被滚动拽走。
 *
 * 刻意不拦截纵向滚轮：在尺子上滚不该把整页的滚动吃掉。
 * 横向滚轮（触控板左右划）没有这个冲突，所以接。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useScrollProgress } from '@/composables/useScrollProgress'
import { SCALE_ANCHORS, SCALE_MAX_LOG, SCALE_MIN_LOG, type ScaleAnchor } from '@/content/scales'

const SPAN = SCALE_MAX_LOG - SCALE_MIN_LOG
const clampLog = (v: number) => Math.min(SCALE_MAX_LOG, Math.max(SCALE_MIN_LOG, v))
const pct = (log: number) => ((log - SCALE_MIN_LOG) / SPAN) * 100

const track = ref<HTMLElement | null>(null)
const dragging = ref(false)
/** 手动操作过之后就不再跟随页面滚动 */
const manual = ref(false)
const manualCursor = ref(SCALE_MIN_LOG)

// 这一节穿过视口的进度：0.1–0.75 段映射成整条尺子，两头留白不至于一进场就到顶
const { el: sectionEl, progress } = useScrollProgress()
const scrolled = computed(() => {
  const t = Math.min(1, Math.max(0, (progress.value - 0.1) / 0.65))
  return SCALE_MIN_LOG + t * SPAN
})

const cursor = computed(() => (manual.value ? manualCursor.value : scrolled.value))
const cursorPct = computed(() => pct(cursor.value))

function setManual(v: number) {
  manual.value = true
  manualCursor.value = clampLog(v)
}

/** 窄屏时轴是纵向的 */
const vertical = ref(false)
function syncOrientation() {
  vertical.value = window.matchMedia('(max-width: 720px)').matches
}

onMounted(() => {
  syncOrientation()
  window.addEventListener('resize', syncOrientation, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('resize', syncOrientation))

/**
 * 读数：把 log10(米) 换成「有效数字 ×10^n 单位」，单位随量级切换（m / km / AU / ly），
 * 让任何位置的读数都是一个能读出来的物理量。
 */
interface Reading {
  mantissa: string
  exponent: string | null
  unit: string
}

const LY_LOG = Math.log10(9.4607304725808e15)
const AU_LOG = Math.log10(1.495978707e11)

function readAt(log: number): Reading {
  let unit = 'm'
  let value = log
  if (log >= LY_LOG - 1) {
    unit = 'ly'
    value = log - LY_LOG
  } else if (log >= AU_LOG - 1) {
    unit = 'AU'
    value = log - AU_LOG
  } else if (log >= 3) {
    unit = 'km'
    value = log - 3
  }

  const exp = Math.floor(value)
  // 指数落在 -1..3 时写成普通数字，读着比科学计数法自然
  if (exp >= -1 && exp <= 3) {
    const plain = 10 ** value
    const digits = plain >= 100 ? 0 : plain >= 10 ? 1 : 2
    return {
      mantissa: plain.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
      exponent: null,
      unit,
    }
  }
  return { mantissa: (10 ** (value - exp)).toFixed(2), exponent: String(exp), unit }
}

const reading = computed(() => readAt(cursor.value))

/** 离读数最近的锚点 */
const nearest = computed<ScaleAnchor>(() => {
  let best = SCALE_ANCHORS[0]!
  let bestD = Infinity
  for (const a of SCALE_ANCHORS) {
    const d = Math.abs(Math.log10(a.meters) - cursor.value)
    if (d < bestD) {
      bestD = d
      best = a
    }
  }
  return best
})

/** 每个数量级一根短刻度，每五个一根长的 */
const ticks = computed(() => {
  const out: { log: number; major: boolean }[] = []
  for (let e = Math.ceil(SCALE_MIN_LOG); e <= Math.floor(SCALE_MAX_LOG); e++) {
    out.push({ log: e, major: e % 5 === 0 })
  }
  return out
})

/** 锚点连同它的位置与标签对齐方式（贴边的往里排，免得标签溢出轴外） */
const anchors = computed(() =>
  SCALE_ANCHORS.map((a) => {
    const position = pct(Math.log10(a.meters))
    return {
      anchor: a,
      position,
      align: position > 88 ? 'end' : position < 4 ? 'start' : 'mid',
    }
  }),
)

// ---- 交互 ----

/** 落点离某个锚点不到这么多个数量级时，直接吸附到那个锚点的精确值 */
const SNAP_DECADES = 0.6

function fromPointer(clientX: number, clientY: number, snap: boolean) {
  const node = track.value
  if (!node) return
  const rect = node.getBoundingClientRect()
  const t = vertical.value
    ? (clientY - rect.top) / rect.height
    : (clientX - rect.left) / rect.width
  const raw = SCALE_MIN_LOG + t * SPAN

  // 点击（不是拖动）时吸附：点在「比邻星」标签上就该读到 4.22 ly 整
  if (snap) {
    for (const a of SCALE_ANCHORS) {
      const log = Math.log10(a.meters)
      if (Math.abs(log - raw) <= SNAP_DECADES) {
        setManual(log)
        return
      }
    }
  }
  setManual(raw)
}

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  fromPointer(e.clientX, e.clientY, true)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  // 拖动过程中不吸附，否则手感会被一格格拽住
  fromPointer(e.clientX, e.clientY, false)
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}

/** 只接横向滚轮，不碰纵向——纵向属于页面 */
function onWheel(e: WheelEvent) {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
  e.preventDefault()
  setManual(cursor.value + Math.sign(e.deltaX) * 0.4)
}

function onKeydown(e: KeyboardEvent) {
  const step = e.shiftKey ? 1 : 0.4
  let next: number
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      next = cursor.value + step
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      next = cursor.value - step
      break
    case 'PageUp':
      next = cursor.value + 2
      break
    case 'PageDown':
      next = cursor.value - 2
      break
    case 'Home':
      next = SCALE_MIN_LOG
      break
    case 'End':
      next = SCALE_MAX_LOG
      break
    default:
      return
  }
  e.preventDefault()
  setManual(next)
}

const ariaText = computed(() => {
  const r = reading.value
  const exp = r.exponent ? ` 乘以 10 的 ${r.exponent} 次方` : ''
  return `${r.mantissa}${exp} ${r.unit}，最接近：${nearest.value.label}`
})

// 屏幕阅读器只在手动操作时需要播报，跟着页面滚动时不停播报会很吵
const live = ref<'off' | 'polite'>('off')
watch(manual, (v) => {
  if (v) live.value = 'polite'
})
</script>

<template>
  <div ref="sectionEl" class="ruler">
    <!-- 读数。等宽 + tabular-nums，跳变时不抖宽度。指数单独排。 -->
    <p class="ruler__readout" aria-hidden="true">
      <span class="data ruler__mantissa">{{ reading.mantissa }}</span>
      <span v-if="reading.exponent" class="data ruler__exp">
        ×10<sup>{{ reading.exponent }}</sup>
      </span>
      <span class="data ruler__unit">{{ reading.unit }}</span>
    </p>
    <p class="fine ruler__nearest" aria-hidden="true">
      最接近 · {{ nearest.label }}
      <span v-if="nearest.note" class="ruler__note">{{ nearest.note }}</span>
    </p>
    <p class="sr-only" :aria-live="live">{{ ariaText }}</p>

    <div
      ref="track"
      class="ruler__track"
      :class="{ 'is-dragging': dragging }"
      role="slider"
      tabindex="0"
      :aria-valuemin="SCALE_MIN_LOG"
      :aria-valuemax="Number(SCALE_MAX_LOG.toFixed(2))"
      :aria-valuenow="Number(cursor.toFixed(2))"
      :aria-valuetext="ariaText"
      aria-label="宇宙尺度尺，以 10 的幂为单位，从人体尺度到可观测宇宙。用方向键移动，Shift 加方向键跨一个数量级。"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheel"
      @keydown="onKeydown"
    >
      <span class="ruler__axis" aria-hidden="true"></span>

      <span
        v-for="t in ticks"
        :key="t.log"
        class="ruler__tick"
        :class="{ 'is-major': t.major }"
        :style="vertical ? { top: `${pct(t.log)}%` } : { left: `${pct(t.log)}%` }"
        aria-hidden="true"
      ></span>

      <!-- 锚点是标注，不是控件：role="slider" 里不能再嵌可聚焦元素。
           点在锚点附近时由 pointerdown 精确吸附过去（见 fromPointer）。 -->
      <span
        v-for="a in anchors"
        :key="a.anchor.label"
        class="ruler__anchor"
        :data-align="a.align"
        :style="vertical ? { top: `${a.position}%` } : { left: `${a.position}%` }"
      >
        <span class="ruler__anchor-mark" aria-hidden="true"></span>
        <span class="ruler__anchor-label">
          <span class="data ruler__anchor-value">
            <template v-if="a.anchor.approx">≈</template>{{ a.anchor.value
            }}<template v-if="a.anchor.exponent">×10<sup>{{ a.anchor.exponent }}</sup></template>
            {{ a.anchor.unit }}
          </span>
          <span class="ruler__anchor-name">{{ a.anchor.label }}</span>
        </span>
      </span>

      <span
        class="ruler__cursor"
        :style="vertical ? { top: `${cursorPct}%` } : { left: `${cursorPct}%` }"
        aria-hidden="true"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.ruler__readout {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
}

.ruler__mantissa {
  font-size: var(--t-title);
  line-height: 1;
  color: var(--ink-0);
}

.ruler__exp {
  font-size: var(--t-lead);
  line-height: 1;
  color: var(--ink-0);
}

.ruler__exp sup,
.ruler__anchor-value sup {
  font-size: 0.62em;
  vertical-align: super;
  line-height: 0;
}

.ruler__unit {
  font-size: var(--t-lead);
  line-height: 1;
  color: var(--ink-1);
}

.ruler__nearest {
  margin-top: var(--s-3);
  min-height: 3.4em; /* 说明行有无都占同样高度，切换锚点时轴不上下跳 */
}

.ruler__note {
  display: block;
}

.ruler__track {
  position: relative;
  margin-top: var(--s-5);
  height: 108px;
  cursor: ew-resize;
  touch-action: pan-y;
}

.ruler__track.is-dragging {
  cursor: grabbing;
}

.ruler__axis {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: var(--ink-0);
}

.ruler__tick {
  position: absolute;
  top: 0;
  width: 1px;
  height: 6px;
  background: var(--ink-2);
}

.ruler__tick.is-major {
  height: 12px;
  background: var(--ink-1);
}

/* 锚点是按钮，但没有背景、没有边框、不是 pill：一根 1px 竖线加两行文字。 */
.ruler__anchor {
  position: absolute;
  top: 0;
  display: grid;
  text-align: left;
  pointer-events: none; /* 点击穿透到轴上，由轴统一处理吸附 */
}

.ruler__anchor-mark {
  width: 1px;
  height: 26px;
  background: var(--ink-0);
}

.ruler__anchor-label {
  display: grid;
  gap: var(--s-1);
  padding-top: var(--s-2);
  white-space: nowrap;
}

/* 贴着轴末端的锚点整体左移一个自身宽度，让那根 1px 竖线落在刻度上、
   标签朝里排。只用 justify-items 不够——这个盒子是自动宽度的，
   它会从刻度位置继续往右长出去，标签就溢出轴外了。 */
.ruler__anchor[data-align='mid'],
.ruler__anchor[data-align='start'] {
  transform: translateX(-0.5px);
}

.ruler__anchor[data-align='end'] {
  transform: translateX(calc(-100% + 0.5px));
  justify-items: end;
}

.ruler__anchor[data-align='end'] .ruler__anchor-label {
  text-align: right;
}

.ruler__anchor-value {
  font-size: var(--t-fine);
  color: var(--ink-0);
}

.ruler__anchor-name {
  font-family: var(--font-sans);
  font-size: var(--t-fine);
  color: var(--ink-1);
}

/* 游标只占刻度带（0–34px），正好停在标签开始的位置：
   横穿标签文字会把字划掉。轴上那个 5px 实心方块用来和锚点的竖线区分开
   （两者都是 1px --ink-0，光靠长度不好认）。 */
.ruler__cursor {
  position: absolute;
  top: 0;
  width: 1px;
  height: 34px;
  background: var(--ink-0);
  transform: translateX(-0.5px);
}

.ruler__cursor::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 5px;
  background: var(--ink-0);
  transform: translateX(-2px);
}

/* 窄屏：轴转竖向，标签排右边。375px 下照样能拖、能读。 */
@media (max-width: 720px) {
  .ruler__track {
    height: auto;
    min-height: 560px;
    margin-top: var(--s-4);
    cursor: ns-resize;
    touch-action: pan-x;
  }

  .ruler__axis {
    right: auto;
    bottom: 0;
    width: 1px;
    height: auto;
  }

  /* 末端那条标注在轴下面还要占两行，用 margin 给下面的提示行让位。
     不能用 track 的 padding —— 刻度和锚点都按 track 的高度百分比定位，
     padding 会把定位用的高度和轴的长度拆成两个数，锚点就会整体偏移。 */
  .ruler {
    margin-bottom: var(--s-5);
  }

  /* 竖排时长短由 width 表示，height 必须显式压回 1px：
     否则桌面那条 .is-major{height:12px} 会留下来，刻度变成 12×12 的灰方块。 */
  .ruler__tick {
    left: 0;
    width: 6px;
    height: 1px;
  }

  .ruler__tick.is-major {
    width: 12px;
    height: 1px;
  }

  /* 竖排时锚点的盒子顶边落在刻度上，而标签是两行（57px 高）。
     align-items: center 会把那条 1px 短横线放到盒子的垂直中点，
     也就是刻度下方 28px 处——线和刻度就对不上了。
     所以用 start 对齐，再把线单独下移到第一行文字的中线上。 */
  .ruler__anchor,
  .ruler__anchor[data-align='mid'],
  .ruler__anchor[data-align='end'] {
    left: 0;
    top: auto;
    grid-auto-flow: column;
    align-items: start;
    justify-items: start;
    gap: var(--s-2);
    transform: translateY(-0.5px);
  }

  /* 短横线必须正好落在刻度上（刻度就是这一节的真值），所以它不带偏移。
     改为把标签整体上提半行，让第一行文字的中线与横线齐平。 */
  .ruler__anchor-mark {
    width: 18px;
    height: 1px;
  }

  .ruler__anchor-label {
    margin-top: -11px;
  }

  .ruler__anchor-label {
    padding-top: 0;
  }

  .ruler__anchor[data-align='end'] .ruler__anchor-label {
    text-align: left;
  }

  .ruler__cursor {
    left: 0;
    top: 0;
    width: 34px;
    height: 1px;
    transform: translateY(-0.5px);
  }

  .ruler__cursor::before {
    transform: translateY(-2px);
  }
}
</style>
