/**
 * 宇宙尺度尺上的锚点。全是可查证的物理量，不是编出来的数字。
 * meters 用于对数定位；label/value 用于显示。
 */

export interface ScaleAnchor {
  /** 以米为单位的量级，尺子按 log10(meters) 定位 */
  meters: number
  /** 中文标注 */
  label: string
  /** 显示用的数值主体，等宽排 */
  value: string
  /** 单位，跟在数值后面 */
  unit: string
  /** 十的幂次，单独排版（如 10^8 的 8） */
  exponent?: string
  /** 数值前的近似号 */
  approx?: boolean
  /** 一句《三体》语境下的说明，没有就不写 */
  note?: string
}

const LY = 9.4607304725808e15 // 光年，米
const AU = 1.495978707e11 // 天文单位，米

export const SCALE_ANCHORS: ScaleAnchor[] = [
  {
    meters: 1.7,
    label: '人',
    value: '1.7',
    unit: 'm',
  },
  {
    meters: 1.2742e7,
    label: '地球直径',
    value: '12,742',
    unit: 'km',
  },
  {
    meters: AU,
    label: '日地距离',
    value: '1.496',
    unit: 'km',
    exponent: '8',
    approx: true,
    note: '1 AU。红岸发射的信号先抵达太阳，再被放大出去。',
  },
  {
    meters: 4.2465 * LY,
    label: '比邻星',
    value: '4.22',
    unit: 'ly',
    note: '离太阳最近的恒星。三体舰队从这里出发。',
  },
  {
    meters: 1e5 * LY,
    label: '银河系直径',
    value: '100,000',
    unit: 'ly',
    approx: true,
  },
  {
    meters: 9.3e10 * LY,
    label: '可观测宇宙',
    value: '9.3',
    unit: 'ly',
    exponent: '10',
    approx: true,
  },
]

/**
 * 尺子的定义域：1 米 到 可观测宇宙，两端就是两个真实的量。
 * 不往外留余量——多出来的那一截会让读数显示出比可观测宇宙还大的数字，
 * 而那个数没有对应的物理量。视觉上的呼吸留白交给 CSS。
 */
export const SCALE_MIN_LOG = 0
export const SCALE_MAX_LOG = Math.log10(9.3e10 * LY)
