#!/usr/bin/env node
// 把 public/images/*.jpg 压成 AVIF + WebP，并把原 JPG 也压到 200KB 以内。
// 用法： node scripts/optimize-images.mjs [--force]
//
// 依赖系统里的 avifenc / cwebp / sips（macOS 自带），不引入 npm 依赖。
// 原图备份在 .cache/images-orig/，每次都从备份重压，保证可重复执行。
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')
const OUT = resolve(ROOT, 'public/images')
const ORIG = resolve(ROOT, '.cache/images-orig')

const TARGET_BYTES = 200 * 1024
const MAX_EDGE = 1536 // 素材本身最宽就是 1536，超出没有意义

// 质量档位从高往低走，第一个达标的就用。
// 为什么起点这么高：这批素材是近乎纯黑的深空 + 细film grain，
// 暗部的平缓过渡是有损压缩最难的情形——质量给低了会在黑场里压出成块的
// 灰色矩形（在纯黑背景上一眼就看得见）。高质量下它们照样只有几十 KB。
const AVIF_STEPS = [90, 86, 80, 72, 60]
const WEBP_STEPS = [92, 88, 82, 74, 64]
const JPEG_STEPS = [88, 80, 70, 60, 50]

const kb = (n) => `${(n / 1024).toFixed(0)}KB`
const has = (cmd) => {
  try { execFileSync('command', ['-v', cmd], { shell: '/bin/sh', stdio: 'ignore' }); return true }
  catch { return false }
}

for (const cmd of ['avifenc', 'cwebp', 'sips']) {
  if (!has(cmd)) {
    console.error(`缺少 ${cmd}。macOS: brew install libavif webp`)
    process.exit(1)
  }
}

mkdirSync(ORIG, { recursive: true })

// 首次运行时把现有 JPG 存为原始副本（之后都以副本为源，避免反复有损重压）
for (const f of readdirSync(OUT).filter((f) => extname(f) === '.jpg')) {
  const backup = resolve(ORIG, f)
  if (!existsSync(backup)) copyFileSync(resolve(OUT, f), backup)
}

const names = readdirSync(ORIG).filter((f) => extname(f) === '.jpg')
if (!names.length) {
  console.error('.cache/images-orig/ 里没有原图。先跑 node scripts/gen-images.mjs')
  process.exit(1)
}

// 从最高质量往下退，第一个进预算的档位就用。
function encodeUntilUnder(label, out, steps, run) {
  let last = 0
  for (const step of steps) {
    run(step)
    last = statSync(out).size
    if (last <= TARGET_BYTES) return { size: last, step }
  }
  return { size: last, step: steps.at(-1), over: true }
}

console.log(`压制 ${names.length} 张 → public/images/（上限 ${kb(TARGET_BYTES)}/张）`)
let worst = 0

for (const name of names) {
  const src = resolve(ORIG, name)
  const stem = basename(name, '.jpg')
  const before = statSync(src).size

  // JPEG 兜底：sips 只接受整数质量档位，用 --resampleHeightWidthMax 兜住尺寸
  const jpg = resolve(OUT, `${stem}.jpg`)
  const j = encodeUntilUnder(stem, jpg, JPEG_STEPS, (q) => {
    copyFileSync(src, jpg)
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(q),
      '--resampleHeightWidthMax', String(MAX_EDGE), jpg, '--out', jpg], { stdio: 'ignore' })
  })

  // AVIF 与 WebP 都从原图编码，不要拿刚压过的 JPEG 当输入（避免二次有损叠加）
  const avif = resolve(OUT, `${stem}.avif`)
  const a = encodeUntilUnder(stem, avif, AVIF_STEPS, (q) => {
    execFileSync('avifenc', ['-q', String(q), '-s', '4', '--jobs', 'all', src, avif], { stdio: 'ignore' })
  })

  const webp = resolve(OUT, `${stem}.webp`)
  const w = encodeUntilUnder(stem, webp, WEBP_STEPS, (q) => {
    execFileSync('cwebp', ['-q', String(q), '-quiet', src, '-o', webp], { stdio: 'ignore' })
  })

  worst = Math.max(worst, j.size, a.size, w.size)
  const flag = [j, a, w].some((r) => r.over) ? '  ← 仍超标' : ''
  console.log(
    `  ${stem.padEnd(18)} ${kb(before).padStart(7)} → ` +
    `avif ${kb(a.size).padStart(6)}  webp ${kb(w.size).padStart(6)}  jpg ${kb(j.size).padStart(6)}${flag}`,
  )
}

console.log(`最大单张 ${kb(worst)}`)
process.exit(worst > TARGET_BYTES ? 1 : 0)
