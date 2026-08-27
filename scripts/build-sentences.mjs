#!/usr/bin/env node
// 抓取并清洗《三体》书摘数据 → src/content/sentences.json
// 用法： node scripts/build-sentences.mjs [--offline]
// 源数据是一个纯字符串数组，本脚本只做「规整」，不添加任何原始数据里没有的信息。
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')
const SRC = 'https://raw.githubusercontent.com/AyagawaSeirin/ThreebodySpace/refs/heads/master/sentence/sentence.json'
const CACHE = resolve(ROOT, '.cache/sentence.raw.json')
const OUT = resolve(ROOT, 'src/content/sentences.json')

async function load() {
  if (process.argv.includes('--offline') && existsSync(CACHE)) {
    return JSON.parse(readFileSync(CACHE, 'utf8'))
  }
  const res = await fetch(SRC)
  if (!res.ok) throw new Error(`拉取失败 HTTP ${res.status}`)
  const raw = await res.json()
  mkdirSync(dirname(CACHE), { recursive: true })
  writeFileSync(CACHE, JSON.stringify(raw))
  return raw
}

// 源数据的全角/半角混用只在中文语境下纠正，英文片段原样保留。
function tidy(line) {
  let s = line.trim()
  s = s.replace(/・/g, '·')          // 片假名中点 → 间隔号
  s = s.replace(/―{2,}/g, '——')      // 水平线 ― 连用 → 中文破折号
  s = s.replace(/[.·]{3,}/g, '……')   // 源数据里用 ... / ・・・ 表示省略
  // 半角逗号/分号：前后都是中日韩字符时才转全角，避免动到英文与数字
  s = s.replace(/(?<=[一-鿿]),(?=[一-鿿])/g, '，')
  s = s.replace(/(?<=[一-鿿]);(?=[一-鿿])/g, '；')
  s = s.replace(/(?<=[一-鿿])\.$/, '。')
  return s.replace(/\s+/g, ' ').trim()
}

// 末行结尾的「——某某」当作出处，且只在它足够短、像个名字或篇名时才拆。
// 只拆单行条目：多行对白里每一行可能各有自己的说话人（维德一行、程心一行），
// 把末行的署名提上来代表整条会张冠李戴，那种情况原样保留。
// 拆不出来的就整句留着 —— 宁可不标注，也不猜。
function splitAttribution(lines) {
  if (lines.length !== 1) return { lines, attribution: null }
  const m = lines[0].match(/^(.*?[。！？…”』」])\s*——\s*([^，。！？]{1,12})$/)
  if (!m) return { lines, attribution: null }
  const body = m[1].trim()
  if (!body) return { lines, attribution: null }
  return { lines: [body], attribution: m[2].trim() }
}

const raw = await load()
if (!Array.isArray(raw)) throw new Error('源数据不是数组')

const seen = new Set()
const sentences = []
for (const item of raw) {
  if (typeof item !== 'string') continue
  const lines = item.split('\r~').map(tidy).filter(Boolean)
  if (!lines.length) continue
  const { lines: body, attribution } = splitAttribution(lines)
  const text = body.join('\n')
  const key = text.replace(/\s/g, '')
  if (seen.has(key)) continue
  seen.add(key)
  const chars = key.length
  sentences.push({
    id: `s${String(sentences.length + 1).padStart(3, '0')}`,
    lines: body,
    attribution,                                   // 源数据里有才有，其余为 null
    dialogue: body.length > 1,                     // 多行：对白或分行引文
    chars,
    // 只是排版分档，决定用多大字号，不代表内容分类
    weight: chars <= 30 ? 'display' : chars <= 80 ? 'normal' : 'passage',
  })
}

const stats = {
  source: SRC,
  fetchedFrom: process.argv.includes('--offline') ? 'cache' : 'network',
  total: sentences.length,
  droppedDuplicates: raw.length - sentences.length,
  withAttribution: sentences.filter((s) => s.attribution).length,
  byWeight: sentences.reduce((a, s) => ((a[s.weight] = (a[s.weight] || 0) + 1), a), {}),
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ stats, sentences }, null, 2) + '\n')
console.log(JSON.stringify(stats, null, 2))
console.log(`→ ${OUT}`)
