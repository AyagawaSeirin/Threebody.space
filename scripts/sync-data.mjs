#!/usr/bin/env node
// 把 src/content/sentences.json 同步到 public/data/，让它作为静态资源被 fetch，
// 而不是被打进首屏 bundle。dev 与 build 前自动执行。
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')
const src = resolve(ROOT, 'src/content/sentences.json')
const out = resolve(ROOT, 'public/data/sentences.json')

// 文案里写着「423 条」的地方有好几处（页脚、关于页、首页入口、页面标题）。
// 数据一旦重建成别的条数，那些文案就变成了错的数字——这里直接拦住。
const EXPECTED_TOTAL = 423
const data = JSON.parse(readFileSync(src, 'utf8'))
if (data.stats.total !== EXPECTED_TOTAL || data.sentences.length !== EXPECTED_TOTAL) {
  console.error(
    `条数变了：stats.total=${data.stats.total}, sentences=${data.sentences.length}，` +
      `文案里写的是 ${EXPECTED_TOTAL}。\n` +
      `改数据的话，同时改掉这些地方的文案：\n` +
      `  src/content/concepts.ts（SENTENCES_SECTION）\n` +
      `  src/views/AboutView.vue、src/components/SiteFooter.vue、src/router.ts\n` +
      `以及本脚本里的 EXPECTED_TOTAL。`,
  )
  process.exit(1)
}

mkdirSync(dirname(out), { recursive: true })
copyFileSync(src, out)
console.log(
  `sentences.json → public/data/  ${(statSync(out).size / 1024).toFixed(0)}KB  ${data.stats.total} 条`,
)
