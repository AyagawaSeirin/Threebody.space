/**
 * 三体运动的物理部分。纯函数，不依赖 Vue，不碰 DOM。
 *
 * 页内那个小画布和 /simulation 全屏页共用这一份——
 * 两处各写一遍积分器，迟早会走偏成两种物理。
 *
 * 构型是「自由落体三体」：三个质点摆成不规则三角形、从静止释放。
 * 经典的混沌构型，没有周期性；混沌的必然结局是某个质点迟早被甩出系统。
 */

export interface Body {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  m: number
  /** 轨迹点，x/y 交替存 */
  trail: number[]
}

const G = 1

/**
 * 引力软化半径的平方。
 * 混沌构型必然出现近距交会（400 局统计里最小间距中位数约 0.016），
 * 不软化的话固定步长撑不住，能量会在交会瞬间爆掉。
 * 0.15 这一档实测最坏能量漂移 6.5e-4。
 */
export const SOFT2 = 0.15 * 0.15

/** 积分步长。与 SOFT2 是一组，改一个就要重新测能量漂移。 */
export const DT = 0.002

/** 离质心超过这个距离视为逃逸，本局结束 */
export const ESCAPE_R = 2.6

/** 三个质点的质量。略有差异，避免落进对称特例。 */
export const MASSES = [1.05, 1, 0.95] as const

/**
 * 种子池。每个数喂给 mulberry32 生成一个「从静止释放的不规则三角形」。
 * 用数值试验筛过（3000 个候选里取前 24 个合格的）：
 * 只留能撑 40–160 个时间单位才逃逸的局——太短的开场即散，太长的看不到换局。
 * 种子只决定三角形的形状，物理本身没有任何脚本。
 */
export const CHAOS_SEEDS = [
  2, 6, 10, 12, 15, 16, 19, 20, 26, 30, 32, 36,
  38, 42, 43, 47, 48, 53, 55, 59, 62, 69, 72, 73,
] as const

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

export function seedBodies(seedId: number): Body[] {
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

export function accelerate(bs: Body[]) {
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

/** 速度 Verlet：半步速度 → 整步位置 → 重算加速度 → 补半步速度 */
export function step(bs: Body[], dt: number = DT) {
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

/** 减掉质心的位置与动量。纯粹是取景，不改物理。 */
export function recenter(bs: Body[]) {
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

export function pushTrail(bs: Body[], max: number) {
  for (const b of bs) {
    b.trail.push(b.x, b.y)
    if (b.trail.length > max * 2) b.trail.splice(0, 2)
  }
}

/** 有质点跑出逃逸半径就说明本局结束了 */
export function escaped(bs: Body[]): boolean {
  return bs.some((b) => Math.hypot(b.x, b.y) > ESCAPE_R)
}

/** 系统总能量。只用于数值自查，页面不显示。 */
export function energy(bs: Body[]): number {
  let e = 0
  for (const b of bs) e += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy)
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i]!
      const b = bs[j]!
      const d = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + SOFT2)
      e -= (G * a.m * b.m) / d
    }
  }
  return e
}
