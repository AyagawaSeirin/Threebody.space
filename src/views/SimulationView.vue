<script setup lang="ts">
/**
 * /simulation —— 满屏的三体运动模拟。
 *
 * 和页内那个小画布共用 @/lib/threebody 的物理（同一套积分器、同一个种子池），
 * 差别只在呈现：铺满视口、质点画得大一些、拖尾更长，
 * 并且把「重新开始」和「速度」交给读者。
 *
 * 速度是改每帧的积分步数，不是改步长——
 * 改 DT 会同时改变数值精度（能量漂移是按 DT 标定的），
 * 改步数只是让同样精度的积分走得快慢不同，物理不变。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useReducedMotion } from '@/composables/useReducedMotion'
import {
  CHAOS_SEEDS,
  DT,
  ESCAPE_R,
  accelerate,
  escaped,
  pushTrail,
  recenter,
  seedBodies,
  step,
  type Body,
} from '@/lib/threebody'

const canvas = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()

/** 满屏取景比页内那个松一点：视口大，留白不至于显空 */
const VIEW_R = 2.1
/** 拖尾更长——屏幕大，画得起 */
const TRAIL_MAX = 1400

/** 速度档位。改的是每帧积分步数，不是步长。 */
const SPEEDS = [
  { label: '0.5×', steps: 6 },
  { label: '1×', steps: 12 },
  { label: '2×', steps: 24 },
  { label: '4×', steps: 48 },
] as const

const speedIndex = ref(1)
const stepsPerFrame = computed(() => SPEEDS[speedIndex.value]!.steps)

/** 本局的种子与已跑的时间（用于显示，不参与物理） */
const seedIndex = ref(Math.floor(Math.random() * CHAOS_SEEDS.length))
const elapsed = ref(0)
const rounds = ref(1)
const fading = ref(false)
/** 暂停：只停积分，不清画面 */
const paused = ref(false)

let bodies: Body[] = seedBodies(CHAOS_SEEDS[seedIndex.value]!)
let frame = 0
let switching = false

function loadRound(index: number) {
  seedIndex.value = index
  bodies = seedBodies(CHAOS_SEEDS[index]!)
  accelerate(bodies)
  elapsed.value = 0
}

/** 重新开始：换一组初值，不重复当前这一局 */
function restart() {
  let next = Math.floor(Math.random() * CHAOS_SEEDS.length)
  if (next === seedIndex.value) next = (next + 1) % CHAOS_SEEDS.length
  loadRound(next)
  rounds.value += 1
  fading.value = false
  switching = false
}

/** 质点逃逸后自动换局：淡出 → 新初值 → 淡入 */
function autoNext() {
  if (switching) return
  switching = true
  fading.value = true
  window.setTimeout(() => {
    restart()
  }, 360)
}

let ctx: CanvasRenderingContext2D | null = null
let cssW = 0
let cssH = 0
let dpr = 1

function resize() {
  const el = canvas.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = el.parentElement
  cssW = box?.clientWidth ?? window.innerWidth
  cssH = box?.clientHeight ?? window.innerHeight
  el.width = Math.round(cssW * dpr)
  el.height = Math.round(cssH * dpr)
  el.style.width = `${cssW}px`
  el.style.height = `${cssH}px`
  ctx = el.getContext('2d')
  if (ctx) draw(ctx)
}

function draw(c: CanvasRenderingContext2D) {
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.clearRect(0, 0, cssW, cssH)

  // 按较短边定标，保证宽屏和竖屏都装得下整个活动范围、且不变形
  const scale = Math.min(cssW, cssH) / (VIEW_R * 2)
  const px = (v: number) => cssW / 2 + v * scale
  const py = (v: number) => cssH / 2 + v * scale

  // 轨迹：1px 白线，越旧越淡
  c.lineWidth = 1
  c.lineCap = 'butt'
  for (const b of bodies) {
    const n = b.trail.length / 2
    for (let i = 1; i < n; i++) {
      const age = i / n
      c.strokeStyle = `rgba(242, 242, 240, ${(age * age * 0.55).toFixed(3)})`
      c.beginPath()
      c.moveTo(px(b.trail[(i - 1) * 2]!), py(b.trail[(i - 1) * 2 + 1]!))
      c.lineTo(px(b.trail[i * 2]!), py(b.trail[i * 2 + 1]!))
      c.stroke()
    }
  }

  /*
    三个质点画成圆——它们是恒星，不是 UI 元件（详见 ThreeBodyCanvas.vue 的同一处注释）。
    半径按质量分三档（1.05 / 1 / 0.95）。
    档位之间要差够一个像素：3 和 3.5 光栅化后都是 6×6，看不出区别，
    所以取 5 / 4 / 3——实测 bbox 分别是 10×10 / 8×8 / 6×6。
  */
  c.fillStyle = '#f2f2f0'
  for (const b of bodies) {
    const r = b.m > 1.02 ? 5 : b.m < 0.98 ? 3 : 4
    c.beginPath()
    c.arc(px(b.x), py(b.y), r, 0, Math.PI * 2)
    c.fill()
  }
}

function tick() {
  if (!ctx) return
  if (!switching && !paused.value) {
    for (let i = 0; i < stepsPerFrame.value; i++) step(bodies, DT)
    recenter(bodies)
    pushTrail(bodies, TRAIL_MAX)
    elapsed.value += stepsPerFrame.value * DT
    if (escaped(bodies)) autoNext()
  }
  draw(ctx)
  frame = requestAnimationFrame(tick)
}

/** 减弱动态效果：不跑循环，积分一段画一张静态图 */
function still() {
  if (!ctx) return
  for (let n = 0; n < 20000; n++) {
    step(bodies, DT)
    if (n % 10 === 0) pushTrail(bodies, TRAIL_MAX)
  }
  recenter(bodies)
  elapsed.value = 20000 * DT
  draw(ctx)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault()
    restart()
  } else if (e.key === ' ') {
    e.preventDefault()
    paused.value = !paused.value
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
    e.preventDefault()
    speedIndex.value = Math.min(SPEEDS.length - 1, speedIndex.value + 1)
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
    e.preventDefault()
    speedIndex.value = Math.max(0, speedIndex.value - 1)
  }
}

onMounted(() => {
  document.title = '三体运动模拟 · Threebody.space'
  resize()
  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('keydown', onKeydown)
  accelerate(bodies)
  if (reduced.value) still()
  else frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main id="main" class="sim">
    <div class="sim__stage">
      <canvas
        ref="canvas"
        class="sim__canvas"
        :class="{ 'is-fading': fading }"
        role="img"
        aria-label="三体运动模拟：三个质点从静止释放，在彼此引力下作混沌运动。白色细线是走过的轨迹。某个质点被甩出系统后，自动换一组初始位置重新开始。"
      ></canvas>
    </div>

    <!-- 说明与控件压在画布上，不遮挡中间的运动 -->
    <div class="sim__head">
      <h1 class="sim__title">三体运动模拟</h1>
      <p class="fine sim__note">
        三个质点摆成不规则三角形、从静止释放，此后只受彼此的引力。轨迹是实时算出来的。
        这个构型是混沌的：没有周期，也没有通解，某个质点迟早会被甩出系统——那时自动换一组初值重新开始。
      </p>
    </div>

    <div class="sim__panel">
      <div class="sim__group">
        <span class="fine sim__label">速度</span>
        <div class="sim__speeds">
          <button
            v-for="(s, i) in SPEEDS"
            :key="s.label"
            type="button"
            class="sim__speed"
            :class="{ 'is-on': i === speedIndex }"
            :aria-pressed="i === speedIndex"
            @click="speedIndex = i"
          >
            <span class="data">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <div class="sim__group">
        <button type="button" class="text-button" @click="restart">重新开始</button>
        <button type="button" class="text-button" @click="paused = !paused">
          {{ paused ? '继续' : '暂停' }}
        </button>
      </div>

      <p class="fine sim__readout" aria-live="off">
        第 <span class="data">{{ rounds }}</span> 局 ·
        已跑 <span class="data">{{ elapsed.toFixed(0) }}</span> 个时间单位 ·
        逃逸半径 <span class="data">{{ ESCAPE_R }}</span>
      </p>
      <p class="fine sim__keys">R 重新开始 · 空格 暂停 · 方向键 调速</p>
      <p class="fine sim__back">
        <RouterLink to="/">回到首页</RouterLink>
      </p>
    </div>
  </main>
</template>

<style scoped>
.sim {
  position: relative;
  height: 100svh;
  overflow: hidden;
}

.sim__stage {
  position: absolute;
  inset: 0;
  /* 画布垫在最底层。它和文字层都是 absolute，不写 z-index 的话
     后出现的画布会盖住前面的标题（实测 elementFromPoint 命中的是画布）。 */
  z-index: 0;
}

.sim__canvas {
  display: block;
  transition: opacity 320ms var(--ease);
}

.sim__canvas.is-fading {
  opacity: 0;
}

/* 文字压在画布上。底是纯黑加细白线，白字直接叠，不加蒙版。 */
.sim__head {
  position: absolute;
  z-index: 1;
  top: var(--s-4);
  left: var(--s-4);
  max-width: 30em;
  pointer-events: none;
}

.sim__title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--t-lead);
  line-height: 1.3;
  color: var(--ink-0);
}

.sim__note {
  margin-top: var(--s-3);
  max-width: 26em;
}

.sim__panel {
  position: absolute;
  z-index: 1;
  left: var(--s-4);
  bottom: var(--s-4);
  display: grid;
  gap: var(--s-3);
  justify-items: start;
}

.sim__group {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
}

.sim__label {
  color: var(--ink-1);
}

.sim__speeds {
  display: flex;
  gap: var(--s-3);
}

/* 档位按钮：纯文字 + 1px 下边框，选中的那档描边变亮。不是 pill。 */
.sim__speed {
  padding: 0 0 var(--s-1);
  border: 0;
  border-bottom: 1px solid transparent;
  background: none;
  color: var(--ink-1);
  font-size: var(--t-fine);
  line-height: 1.6;
  cursor: pointer;
  transition: color var(--dur-hover) var(--ease), border-color var(--dur-hover) var(--ease);
}

.sim__speed:hover {
  color: var(--ink-0);
}

.sim__speed.is-on {
  color: var(--ink-0);
  border-bottom-color: var(--ink-0);
}

.sim__readout,
.sim__keys {
  /* 不叠 opacity：--ink-1 本身只有 6.06:1，乘 0.8 就掉到 4.1:1，
     14px 正文不到 4.5:1。层级靠位置和措辞给，不靠压透明度。 */
  color: var(--ink-1);
}

@media (max-width: 720px) {
  /* 窄屏：说明收短，控件仍在左下角，别压住中间的运动 */
  .sim__note {
    display: none;
  }

  .sim__panel {
    gap: var(--s-2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sim__canvas {
    transition: none;
  }
}
</style>
