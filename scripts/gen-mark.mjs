#!/usr/bin/env node
/**
 * 生成站点标记里那条轨道曲线。
 *
 * 为什么要跑一遍积分而不是手画贝塞尔：这个标记是「三体」，那条 8 字曲线
 * 就该是三体问题真的解出来的轨道，而不是照着 8 字描出来的装饰线。
 * 用的初值、积分器、扰动量和页面上的 ThreeBodyCanvas.vue 完全一致。
 *
 * 用法： node scripts/gen-mark.mjs
 * 输出： 一段 SVG path 的 d 属性，粘进 SiteMark.vue
 */
const G = 1
const DT = 0.0035
/*
  标记用「精确」的 8 字周期解（扰动 0），不是页面上那条扰动过的。
  两处用意不同：
  - 页面的模拟器要展示「无法长期预测」，所以必须扰动，轨道每圈都走在新位置上；
  - 标记要的是一条闭合、稳定、每次生成都一样的曲线（logo 不能每次编译都变形）。
  精确解下三个质点共用同一条 8 字轨道，所以这条线同时也是「三体」这件事本身。
*/
const PERTURBATION = 0

function seed() {
  return [
    [0.97000436, -0.24308753, 0.466203685, 0.43236573],
    [-0.97000436, 0.24308753, 0.466203685, 0.43236573],
    [0, 0, -0.93240737 * (1 + PERTURBATION), -0.86473146],
  ].map(([x, y, vx, vy]) => ({ x, y, vx, vy, ax: 0, ay: 0, m: 1 }))
}

function accelerate(bs) {
  for (const b of bs) { b.ax = 0; b.ay = 0 }
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], b = bs[j]
      const dx = b.x - a.x, dy = b.y - a.y
      const d2 = dx * dx + dy * dy
      const inv = 1 / (d2 * Math.sqrt(d2))
      const fx = G * dx * inv, fy = G * dy * inv
      a.ax += fx * b.m; a.ay += fy * b.m
      b.ax -= fx * a.m; b.ay -= fy * a.m
    }
  }
}

function step(bs, dt) {
  for (const b of bs) { b.vx += 0.5 * b.ax * dt; b.vy += 0.5 * b.ay * dt; b.x += b.vx * dt; b.y += b.vy * dt }
  accelerate(bs)
  for (const b of bs) { b.vx += 0.5 * b.ax * dt; b.vy += 0.5 * b.ay * dt }
}

function recenter(bs) {
  let mx = 0, my = 0, M = 0
  for (const b of bs) { mx += b.x * b.m; my += b.y * b.m; M += b.m }
  mx /= M; my /= M
  for (const b of bs) { b.x -= mx; b.y -= my }
}

const bodies = seed()
recenter(bodies)
accelerate(bodies)

// 采一整圈：8 字解的周期约 6.32 个时间单位，取够一圈多一点
const PERIOD = 6.3259
const totalSteps = Math.round(PERIOD / DT)
const SAMPLES = 132

const track = []
let sampleEvery = Math.max(1, Math.floor(totalSteps / SAMPLES))
for (let n = 0; n <= totalSteps; n++) {
  if (n % sampleEvery === 0) track.push([bodies[0].x, bodies[0].y])
  step(bodies, DT)
}

/*
  取景。
  8 字解本身长宽比约 3:1，直接等比塞进 24×24 的方框只有 7 个单位高，
  在 26px 的导航里就是一团糊掉的 ∞。两步处理：
  1. 转 90°（x/y 互换），让它成为竖向的 8 字——竖向在小尺寸下辨识度高得多；
  2. 两个轴各自拉满方框，不强求等比。这条曲线是标记不是图表，
     它要传达的是「两个环 + 一个交点」这个拓扑，不是精确的长宽比。
*/
const rotated = track.map(([x, y]) => [y, x])
const xs = rotated.map((p) => p[0]), ys = rotated.map((p) => p[1])
const minX = Math.min(...xs), maxX = Math.max(...xs)
const minY = Math.min(...ys), maxY = Math.max(...ys)
const pad = 2.5, span = 24 - pad * 2
const scaleX = span / (maxX - minX)
const scaleY = span / (maxY - minY)
const map = ([x, y]) => [
  +(pad + (x - minX) * scaleX).toFixed(2),
  +(pad + (y - minY) * scaleY).toFixed(2),
]
const mapRaw = ([x, y]) => map([y, x])

const pts = rotated.map(map)
const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + ' Z'

// 闭合校验：精确周期解跑满一圈应该回到起点
const [sx, sy] = pts[0], [ex, ey] = pts.at(-1)
const gap = Math.hypot(ex - sx, ey - sy)
console.log(`轨道采样 ${pts.length} 点，一个周期（${PERIOD} 时间单位）`)
console.log(`闭合误差 ${gap.toFixed(3)}（viewBox 单位，24 为全宽）`)
if (gap > 0.6) {
  console.error('曲线没有闭合，检查 PERIOD 或积分步长')
  process.exit(1)
}
console.log(`包络 x ${minX.toFixed(3)}..${maxX.toFixed(3)}  y ${minY.toFixed(3)}..${maxY.toFixed(3)}`)
console.log('\nd="' + d + '"\n')

// 三个质点在 t=0 的位置，也映射进同一个坐标系
const start = seed()
recenter(start)
console.log('三个质点起始位置（viewBox 坐标，2×2 方点的左上角）：')
for (const b of start) {
  const [x, y] = mapRaw([b.x, b.y])
  console.log(`  <rect x="${(x - 1).toFixed(2)}" y="${(y - 1).toFixed(2)}" width="2" height="2" />`)
}
console.log('\n改完记得同步两处：src/components/SiteMark.vue 与 public/favicon.svg')
