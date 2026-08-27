#!/usr/bin/env node
// 生成 Threebody.space 的图片素材。
// 用法： node scripts/gen-images.mjs [name ...]     不带参数则生成全部缺失项
// 凭据来自 .env.imagegen.local（已 gitignore）。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')
const OUT = resolve(ROOT, 'public/images')

function loadEnv() {
  const raw = readFileSync(resolve(ROOT, '.env.imagegen.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

// 共用的画面语法：纯黑、近单色、留白给文字、无字无 logo。
const GRAMMAR =
  'Pure black background (#000), near-monochrome cold greyscale, at most one single ' +
  'desaturated warm-red point of light. Photoreal cinematic still, anamorphic, heavy fine ' +
  'film grain, deep crushed blacks, no lens flare, no bloom, no color gradient wash, ' +
  'no nebula clouds, no purple, no teal-orange grade. Composition leaves a large empty ' +
  'black area for text overlay. Absolutely no text, no letters, no numbers, no watermark, ' +
  'no logo, no UI, no people facing camera.'

const SHOTS = {
  'hero-void': {
    size: '1536x1024',
    prompt:
      'An almost entirely empty black frame. Slightly right of centre, three small but ' +
      'clearly visible points of light in a loose triangle — two cold white with tight ' +
      'diffraction spikes, one dull red and larger — nothing else in the frame. No ' +
      'planets, no ship, no dust, no other stars. The emptiness is the subject, and the ' +
      'entire left half is empty black. ' + GRAMMAR,
  },
  'red-coast': {
    size: '1536x1024',
    prompt:
      'Night photograph from far below and behind: the silhouette of an enormous ' +
      '1960s-era parabolic radio telescope on a bare mountain ridge, aimed at a black ' +
      'empty sky. Only rim light — a faint cold grey edge on the dish truss and one small ' +
      'deep-red aviation lamp on the mast. 90% of the frame is black sky, vast and empty ' +
      'above the ridge. ' + GRAMMAR,
  },
  'dark-forest': {
    size: '1536x1024',
    prompt:
      'Ultra-minimal abstract still. Pure black field filled with thousands of barely ' +
      'visible needle-thin vertical shafts of cold white light, receding edge-on into ' +
      'blackness like a dense forest seen from inside. Almost invisible, 96% black. ' +
      'Exactly one shaft is slightly brighter than every other. ' + GRAMMAR,
  },
  'fleet-silhouette': {
    size: '1536x1024',
    prompt:
      'Cinematic wide shot in black deep space. A colossal derelict warship hull crossing ' +
      'the frame diagonally, rendered almost entirely as silhouette — a single razor-thin ' +
      'cold white rim-light traces its upper edge, revealing hard industrial plating. ' +
      'No engine glow, no windows lit, no stars in front of it. ' + GRAMMAR,
  },
  droplet: {
    size: '1024x1024',
    // 下面这行里的「无接缝」是摄影术语（指无接缝背景纸），
    // 是给图像模型的取景指令，不是页面文案，页面上从不出现这个词。
    prompt:
      // deslop-ignore-next-line 14
      'Macro still on a seamless pure black void. One teardrop-shaped object of ' +
      'mirror-polished chrome, absolute specular perfection, zero texture, zero scratches, ' +
      'floating and centred. It reflects nothing except one thin straight horizon line of ' +
      'white light. The body reads as pure darkness with two razor specular highlights. ' + GRAMMAR,
  },
  trisolaris: {
    size: '1536x1024',
    prompt:
      'Airless rocky planet surface at the bottom edge of the frame, cracked dry plateau, ' +
      'lit only by hard rim light. Above it a black sky holding three suns at very ' +
      'different apparent sizes — one small and blinding white, one mid-sized dull red, ' +
      'one a distant point. Long hard triple shadows across the rock. Vast black sky. ' + GRAMMAR,
  },
  'two-dimensional': {
    size: '1536x1024',
    prompt:
      'An abstract still: a solar system rendered as a perfectly flat two-dimensional ' +
      'engraving lying on a black plane, seen at a steep raking angle so the plane reads ' +
      'as infinitely thin — planets are flat outlined discs with all their internal ' +
      'structure drawn as thin concentric line-work, like an etching on black glass. ' +
      'Cold white line art on pure black, no volume, no shading, no perspective depth. ' + GRAMMAR,
  },
  'mini-universe': {
    size: '1024x1024',
    prompt:
      'Interior of a very small sealed room floating in absolute void. One bare wall, ' +
      'one closed metal door, a single dim overhead lamp, a tiny patch of soil with one ' +
      'green shoot. Everything beyond the room is pure black nothing. Claustrophobic and ' +
      'quiet, shot on a long lens. ' + GRAMMAR,
  },
  'voxel-tribute': {
    size: '1536x1024',
    prompt:
      'Original voxel-art homage, not a screenshot of any existing game or film. A vast ' +
      'starship interior corridor built entirely from large cubic blocks — blocky walls, ' +
      'blocky floor grates, blocky bulkheads — receding into darkness. Lit by one cold ' +
      'white strip light far down the corridor. Deliberately low-resolution cubic geometry ' +
      'rendered with modern raytraced lighting and soft shadows. No characters. ' + GRAMMAR,
  },
  'og-card': {
    size: '1536x1024',
    prompt:
      'An almost entirely black frame. Lower third: the faint curved limb of a dark planet ' +
      'catching one thin arc of cold white light. Upper two thirds: completely empty black ' +
      'sky with three tiny points of light in a loose triangle. Balanced, calm, symmetrical ' +
      'enough to carry a centred title. ' + GRAMMAR,
  },
}

const env = loadEnv()
const endpoint = (env.IMAGEGEN_LLM_ENDPOINT || '').replace(/\/$/, '')
const key = env.IMAGEGEN_LLM_API_KEY
if (!endpoint || !key) {
  console.error('缺少 IMAGEGEN_LLM_ENDPOINT / IMAGEGEN_LLM_API_KEY')
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

async function shoot(name, spec, attempt = 1) {
  const res = await fetch(`${endpoint}/v1/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-2', prompt: spec.prompt, size: spec.size, n: 1 }),
  })
  const body = await res.json().catch(() => null)
  const b64 = body?.data?.[0]?.b64_json
  if (!b64) {
    if (attempt < 3) {
      console.warn(`  ${name} 第 ${attempt} 次失败，重试`)
      await new Promise((r) => setTimeout(r, 4000 * attempt))
      return shoot(name, spec, attempt + 1)
    }
    throw new Error(`${name}: ${JSON.stringify(body).slice(0, 300)}`)
  }
  const buf = Buffer.from(b64, 'base64')
  writeFileSync(resolve(OUT, `${name}.jpg`), buf)
  const left = body?.usage?.credits_remaining
  console.log(`  ${name}.jpg  ${(buf.length / 1024).toFixed(0)}KB  ${spec.size}${left != null ? `  余额 ${left}` : ''}`)
}

const wanted = process.argv.slice(2)
const names = (wanted.length ? wanted : Object.keys(SHOTS)).filter((n) => {
  if (!SHOTS[n]) { console.error(`未知素材：${n}`); return false }
  if (!wanted.length && existsSync(resolve(OUT, `${n}.jpg`))) { console.log(`  ${n}.jpg 已存在，跳过`); return false }
  return true
})

console.log(`生成 ${names.length} 张素材 → public/images/`)
const results = await Promise.allSettled(names.map((n) => shoot(n, SHOTS[n])))
const failed = results.filter((r) => r.status === 'rejected')
for (const f of failed) console.error('失败：', f.reason.message)
process.exit(failed.length ? 1 : 0)
