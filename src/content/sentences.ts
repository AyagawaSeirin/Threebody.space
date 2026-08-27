/**
 * 书摘数据的类型出口。视图层只依赖这里的类型与 loadSentences()，
 * 不直接读 JSON 结构，也不在首屏 bundle 里出现正文——
 * sentences.json 156KB，由 public/data/sentences.json 运行时 fetch。
 */

export type SentenceWeight = 'display' | 'normal' | 'passage'

export interface Sentence {
  id: string
  /** 一行或多行；渲染时逐行输出，不要合并成一段 */
  lines: string[]
  /** 说话人，全库仅 28 条有；null 时什么都不显示 */
  attribution: string | null
  dialogue: boolean
  chars: number
  weight: SentenceWeight
}

export interface SentenceStats {
  source: string
  fetchedFrom: string
  total: number
  droppedDuplicates: number
  withAttribution: number
  byWeight: Record<SentenceWeight, number>
}

export interface SentenceFile {
  stats: SentenceStats
  sentences: Sentence[]
}

/** 书摘出处，页脚版权说明引用这一条 */
export const SENTENCE_SOURCE =
  'https://github.com/AyagawaSeirin/ThreebodySpace'

import { inlinedSentences } from './assets'

const DATA_URL = `${import.meta.env.BASE_URL}data/sentences.json`

let pending: Promise<SentenceFile> | null = null

/** 全站共用一次请求；重复调用返回同一个 promise。 */
export function loadSentences(): Promise<SentenceFile> {
  if (!pending) {
    // 单文件预览里数据已经在页面上了，直接用，不发请求
    const inline = inlinedSentences()
    if (inline) return Promise.resolve(inline as SentenceFile)

    pending = fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`书摘加载失败 HTTP ${res.status}`)
        return res.json() as Promise<SentenceFile>
      })
      .catch((err) => {
        pending = null
        throw err
      })
  }
  return pending
}
