<script setup lang="ts">
/**
 * 三体运动可视化。原生 Canvas 2D，没有引擎，没有预录路径。
 *
 * 它真的在算：三个质点，牛顿引力，速度 Verlet 积分，
 * 每帧走若干个固定小步长，画 1px 白色轨迹拖尾。
 *
 * 构型是「自由落体三体」：三个质点摆成一个不规则三角形，从静止释放。
 * 这是经典的混沌构型——轨道没有任何周期性，近距交会、甩摆、突然变向，
 * 直到某个质点获得足够动能被甩出系统。这正是书里三体世界的日常：
 * 行星在三颗恒星之间被抛来抛去，没有恒纪元能永远持续。
 *
 * 之前用的是 8 字周期解加扰动，画面太规律，看着像编排好的舞蹈；
 * 现在的取舍反过来：接受「总会有质点逃逸」这个混沌的必然结局，
 * 逃逸后淡出、换一组初值重新开始一局。换局本身就是内容——
 * 每一局的舞步都不一样，这才是「无法长期预测」。
 *
 * 初值从一个筛过的种子池里取（scripts 里的数值试验筛的）：
 * 只留「能撑 40–160 个时间单位才逃逸」的局，太短的开场即散，太长的看不到换局。
 * 种子只决定三角形的形状，物理本身没有任何脚本。
 *
 * prefers-reduced-motion 时不启动循环，只积分若干步画一张静态图。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/composables/useReducedMotion'

const props = withDefaults(defineProps<{ size?: number }>(), { size: 480 })

const canvas = ref<HTMLCanvasElement | null>(null)
const holder = ref<HTMLElement | null>(null)
/** 换局时的淡出淡入：只动 opacity，320ms，标准缓动 */
const fading = ref(false)

interface Body {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  m: number
  trail: number[]
}

const G = 1
// 软化半径：混沌构型必然出现近距交会（实测最小间距 ~0.016），
// 不软化的话步长撑不住，能量会在交会时爆掉。0.15 下最坏漂移 6.5e-4。
const SOFT2 = 0.15 * 0.15
const DT = 0.002
const STEPS_PER_FRAME = 12
const TRAIL_MAX = 620
/** 离质心超过这个距离视为逃逸，本局结束 */
const ESCAPE_R = 2.6
/**
 * 取景半宽。故意比逃逸半径小：大部分时间三个质点都在 ±1.5 以内缠斗，
 * 按逃逸半径取景的话画面四周常年一圈空黑。取紧一点，
 * 逃逸的质点会先冲出画面边缘、随后整幅淡出换局——「被甩出去」看得见。
 */
const VIEW_R = 1.9

const MASSES = [1.05, 1, 0.95]

/**
 * 种子池。每个数喂给 mulberry32 生成一个「从静止释放的不规则三角形」。
 * 用数值试验筛过：这些局都能撑 40–160 个时间单位（约半分钟到两分钟）才逃逸，
 * 期间活动范围不出画面。见仓库脚本的筛选过程。
 */
const CHAOS_SEEDS = [
  2, 6, 10, 12, 15, 16, 19, 20, 26, 30, 32, 36,
  38, 42, 43, 47, 48, 53, 55, 59, 62, 69, 72, 73,
]

/** mulberry32：确定性随机数，同一个种子永远给出同一局 */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedBodies(seedId: number): Body[] {
  const rand = rng(seedId)
  const bs: Body[] = MASSES.map((m) => ({
    x: (rand() - 0.5) * 2.2,
    y: (rand() - 0.5) * 2.2,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    m,
    trail: [],
  }))
  recenter(bs)
  // 归一化：最远质点距质心恰为 1，每局开场大小一致
  const r = Math.max(...bs.map((b) => Math.hypot(b.x, b.y)))
  for (const b of bs) {
    b.x /= r
    b.y /= r
  }
  return bs
}

let seedIndex = Math.floor(Math.random() * CHAOS_SEEDS.length)
let bodies = seedBodies(CHAOS_SEEDS[seedIndex]!)
let frame = 0
let running = false
let switching = false
let observer: IntersectionObserver | null = null

function accelerate(bs: Body[]) {
  for (const b of bs) {
    b.ax = 0
    b.ay = 0
  }
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i]!
      const b = bs[j]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d2 = dx * dx + dy * dy + SOFT2
      const inv = 1 / (d2 * Math.sqrt(d2))
      const fx = G * dx * inv
      const fy = G * dy * inv
      a.ax += fx * b.m
      a.ay += fy * b.m
      b.ax -= fx * a.m
      b.ay -= fy * a.m
    }
  }
}

// 速度 Verlet：半步速度 → 整步位置 → 重算加速度 → 补半步速度
function step(bs: Body[], dt: number) {
  for (const b of bs) {
    b.vx += 0.5 * b.ax * dt
    b.vy += 0.5 * b.ay * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
  }
  accelerate(bs)
  for (const b of bs) {
    b.vx += 0.5 * b.ax * dt
    b.vy += 0.5 * b.ay * dt
  }
}

// 质心漂移会把系统慢慢移出画面：每帧减掉总动量，纯粹是取景，不改物理
function recenter(bs: Body[]) {
  let mx = 0
  let my = 0
  let mvx = 0
  let mvy = 0
  let mass = 0
  for (const b of bs) {
    mx += b.x * b.m
    my += b.y * b.m
    mvx += b.vx * b.m
    mvy += b.vy * b.m
    mass += b.m
  }
  mx /= mass
  my /= mass
  mvx /= mass
  mvy /= mass
  for (const b of bs) {
    b.x -= mx
    b.y -= my
    b.vx -= mvx
    b.vy -= mvy
    for (let i = 0; i < b.trail.length; i += 2) {
      b.trail[i]! -= mx
      b.trail[i + 1]! -= my
    }
  }
}

function pushTrail(bs: Body[]) {
  for (const b of bs) {
    b.trail.push(b.x, b.y)
    if (b.trail.length > TRAIL_MAX * 2) b.trail.splice(0, 2)
  }
}

/** 有质点跑出逃逸半径就说明本局结束了 */
function escaped(bs: Body[]): boolean {
  return bs.some((b) => Math.hypot(b.x, b.y) > ESCAPE_R)
}

/** 换局：画面淡出 → 换一组初值 → 淡入。只动 opacity。 */
function nextRound() {
  if (switching) return
  switching = true
  fading.value = true
  window.setTimeout(() => {
    // 不重复上一局；顺序取也行，随机跳着取更不容易看出池子的存在
    let next = Math.floor(Math.random() * CHAOS_SEEDS.length)
    if (next === seedIndex) next = (next + 1) % CHAOS_SEEDS.length
    seedIndex = next
    bodies = seedBodies(CHAOS_SEEDS[seedIndex]!)
    accelerate(bodies)
    fading.value = false
    switching = false
  }, 360)
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const scale = Math.min(w, h) / (VIEW_R * 2)
  const px = (v: number) => w / 2 + v * scale
  const py = (v: number) => h / 2 + v * scale

  // 轨迹：1px 白线，越旧越淡。分段画，透明度按点的新旧递减。
  ctx.lineWidth = 1
  ctx.lineCap = 'butt'
  for (const b of bodies) {
    const n = b.trail.length / 2
    for (let i = 1; i < n; i++) {
      const age = i / n
      ctx.strokeStyle = `rgba(242, 242, 240, ${(age * age * 0.5).toFixed(3)})`
      ctx.beginPath()
      ctx.moveTo(px(b.trail[(i - 1) * 2]!), py(b.trail[(i - 1) * 2 + 1]!))
      ctx.lineTo(px(b.trail[i * 2]!), py(b.trail[i * 2 + 1]!))
      ctx.stroke()
    }
  }

  // 三个质点：实心小方块。方形而不是圆点，和全站的直角语言一致。
  ctx.fillStyle = '#f2f2f0'
  for (const b of bodies) {
    const s = 3
    ctx.fillRect(Math.round(px(b.x) - s / 2), Math.round(py(b.y) - s / 2), s, s)
  }
}

let ctx: CanvasRenderingContext2D | null = null
let cssW = props.size
let cssH = props.size
let dpr = 1

function setup() {
  const el = canvas.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  cssW = Math.min(props.size, el.parentElement?.clientWidth || props.size)
  // 混沌构型的活动范围是各向同性的（不是 8 字那种扁长条），方形取景
  cssH = cssW
  el.width = Math.round(cssW * dpr)
  el.height = Math.round(cssH * dpr)
  el.style.width = `${cssW}px`
  el.style.height = `${cssH}px`
  ctx = el.getContext('2d')
}

function tick() {
  if (!ctx) return
  if (!switching) {
    for (let i = 0; i < STEPS_PER_FRAME; i++) step(bodies, DT)
    recenter(bodies)
    pushTrail(bodies)
    if (escaped(bodies)) nextRound()
  }
  draw(ctx, cssW, cssH, dpr)
  frame = requestAnimationFrame(tick)
}

function start() {
  if (running || !ctx) return
  running = true
  frame = requestAnimationFrame(tick)
}

function stop() {
  running = false
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

/** 静态一帧：先积分一段，画出已经走乱的轨迹，然后停手 */
function still() {
  if (!ctx) return
  for (let n = 0; n < 9000; n++) {
    step(bodies, DT)
    if (n % 12 === 0) pushTrail(bodies)
  }
  recenter(bodies)
  draw(ctx, cssW, cssH, dpr)
}

onMounted(() => {
  setup()
  if (!ctx) return
  accelerate(bodies)

  if (prefersReducedMotion()) {
    still()
    return
  }

  // 只在画布进视口时跑，滚过去就停——不让它在后台白烧 CPU
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) start()
        else stop()
      }
    },
    { threshold: 0.05 },
  )
  if (holder.value) observer.observe(holder.value)
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
})
</script>

<template>
  <div ref="holder" class="sim">
    <canvas
      ref="canvas"
      class="sim__canvas"
      :class="{ 'is-fading': fading }"
      role="img"
      aria-label="三体运动模拟：三个质点从静止释放，在彼此引力下作混沌运动，白色细线是走过的轨迹。某个质点被甩出后，换一组初始位置重新开始。"
    ></canvas>
  </div>
</template>

<style scoped>
.sim {
  /* 描边和圆角写在同一个盒子上，四个角不会被裁 */
  display: inline-block;
  border: 1px solid var(--ink-2);
  border-radius: var(--r);
  background: var(--void);
  line-height: 0;
}

.sim__canvas {
  display: block;
  max-width: 100%;
  transition: opacity 320ms var(--ease);
}

.sim__canvas.is-fading {
  opacity: 0;
}
</style>
