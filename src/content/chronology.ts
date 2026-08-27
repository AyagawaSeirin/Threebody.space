/**
 * 年表。这里的序号是真有顺序的年份，不是装饰性的 01/02/03。
 *
 * 纪年以原著自己的纪年为准（危机纪元、威慑纪元、广播纪元、掩体纪元），
 * 公元年份是**推算**，一律带「≈」并在表末注明依据——
 * 原著没有直接给出任何一个纪元元年对应公元哪一年。
 */

/**
 * 推算的唯一依据：书中汪淼见到叶文洁是 1969 年的三十八年后，即公元 2007 年，
 * 那一年正是危机纪元元年。其余纪元由各自的跨度顺推：
 * 危机纪元 208 年 → 威慑纪元 62 年 → 广播纪元 → 掩体纪元。
 *
 * 换算只用这一个基准，所以整张表内部自洽；但它和网上流传的几种时间线会差几年
 * （常见的另一套把威慑纪元起点放在 2208 年）。这类差异来自纪元首尾年是否共享，
 * 原著没写，谁也补不出来——所以这里只标「≈」，不装作精确。
 */
const CRISIS_ERA_START = 2007

/** 各纪元元年对应的公元年份（由 CRISIS_ERA_START 顺推） */
const ERA_START: Record<string, number> = {
  危机纪元: CRISIS_ERA_START,
  威慑纪元: CRISIS_ERA_START + 208 - 1, // 危机纪元 208 年那一年，威慑随即建立
  广播纪元: CRISIS_ERA_START + 208 - 1 + 62 - 1,
  掩体纪元: CRISIS_ERA_START + 208 - 1 + 62 - 1 + 60,
}

export interface Era {
  /** 显示用的纪年，等宽排 */
  stamp: string
  /** 公历年份才给 datetime 供 <time> 用；书中虚构纪年留空 */
  datetime?: string
  text: string
  /**
   * 不可撤回的那一类节点，用 --signal 标记。
   * 红色 = 人类发出去的信号 / 收不回的决定，全站预算 5 处：
   * 红岸那盏灯 1、「1971」1、这里 2，剩 1 处不用。
   */
  signal?: boolean
}

/** 已经算好公元年份的年表项 */
export interface DatedEra extends Era {
  /** 推算出的公元年份；本身就是公历的条目为 null（不必再换算一遍） */
  gregorian: number | null
}

const RAW: Era[] = [
  {
    stamp: '1971',
    datetime: '1971',
    text: '红岸基地向太阳发射信息。',
  },
  {
    stamp: '1979',
    datetime: '1979',
    text: '收到回复：不要回答。叶文洁回答了。',
  },
  {
    stamp: '危机纪元 3',
    text: '面壁计划启动，罗辑被选为第四位面壁者。',
  },
  {
    stamp: '危机纪元 205',
    text: '末日之战。一个水滴击溃人类两千艘战舰的联合舰队。',
  },
  {
    stamp: '危机纪元 208',
    text: '罗辑在墓碑前用咒语和核弹链立下威慑，两个世界同时被扣住。危机纪元结束。',
  },
  {
    stamp: '威慑纪元 62',
    text: '执剑人换届，程心接过开关。三体舰队随即转向，威慑失败。',
    signal: true,
  },
  {
    stamp: '广播纪元 元年',
    text: '万有引力号启动引力波广播，三体星系的坐标被发向宇宙。',
  },
  {
    stamp: '掩体纪元 67',
    text: '二向箔投下，太阳系被降为二维。',
    signal: true,
  },
]

/** 把「威慑纪元 62」这类纪年换算成公元年份；换不出来就返回 null */
function toGregorian(stamp: string): number | null {
  // 本身就是公历年份的条目不用换算
  if (/^\d{4}$/.test(stamp)) return null

  const match = stamp.match(/^(\S+?)\s*(元年|\d+)$/)
  if (!match) return null
  const base = ERA_START[match[1]!]
  if (base === undefined) return null
  const year = match[2] === '元年' ? 1 : Number(match[2])
  return base + year - 1
}

export const CHRONOLOGY: DatedEra[] = RAW.map((e) => ({
  ...e,
  gregorian: toGregorian(e.stamp),
}))

/** 年表小字说明：交代纪年体系与换算依据，不让推算出来的数字裸奔 */
export const CHRONOLOGY_NOTE =
  `纪年沿用原著设定。公元年份是推算：书中汪淼见到叶文洁是 1969 年的三十八年后，` +
  `据此取危机纪元元年为公元 ${CRISIS_ERA_START} 年，其余纪元按各自跨度顺推。` +
  `原著没有直接写明任何纪元对应的公元年份，所以这一列只作参考。`
