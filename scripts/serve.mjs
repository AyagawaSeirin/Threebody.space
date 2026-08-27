#!/usr/bin/env node
/**
 * 预览服务器。零依赖，用 node 内置 http。
 *
 * 用法：
 *   node scripts/serve.mjs                 # 默认 4180，监听所有网卡
 *   node scripts/serve.mjs --port 8080
 *   node scripts/serve.mjs --dir dist      # 默认就是 dist
 *   node scripts/serve.mjs --local         # 只听 127.0.0.1，不对局域网开放
 *
 * 两件正经事：
 * 1. History 路由回退：/sentences 这类路径没有对应文件，返回 index.html，
 *    否则刷新页面就是 404。
 * 2. 按扩展名给 Content-Type，并给带哈希的构建产物长缓存、给 HTML 不缓存。
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { networkInterfaces } from 'node:os'

const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

const ROOT = resolve(process.cwd(), flag('dir', 'dist'))
const PORT = Number(flag('port', 4180))
const HOST = argv.includes('--local') ? '127.0.0.1' : '0.0.0.0'

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(`${ROOT} 里没有 index.html。先跑 npm run build`)
  process.exit(1)
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  // normalize + 前缀校验：挡住 ../ 穿越到 dist 之外
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '')
  let file = resolve(ROOT, rel)
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403).end('403')
    return
  }

  const isFile = existsSync(file) && statSync(file).isFile()
  if (!isFile) {
    // History 路由回退：没有这个文件就交给前端路由
    file = join(ROOT, 'index.html')
  }

  const ext = extname(file).toLowerCase()
  const immutable = /-[A-Za-z0-9_-]{8,}\./.test(file) // Vite 的哈希文件名
  res.writeHead(isFile ? 200 : 200, {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  })
  createReadStream(file).pipe(res)
})

server.listen(PORT, HOST, () => {
  const lan = []
  for (const list of Object.values(networkInterfaces())) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) lan.push(ni.address)
    }
  }
  console.log(`\n  Threebody.space 预览  ←  ${ROOT}\n`)
  console.log(`  本机     http://localhost:${PORT}`)
  if (HOST !== '127.0.0.1') {
    for (const ip of lan) console.log(`  局域网   http://${ip}:${PORT}`)
    if (!lan.length) console.log('  （没找到局域网地址）')
  }
  console.log('\n  Ctrl+C 停止\n')
})
