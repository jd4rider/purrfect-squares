#!/usr/bin/env node
/*
 * Browser smoke test for the built game.
 *
 *   npm run build && node scripts/smoke.mjs http://localhost:4173/
 *
 * Uses the Playwright that ships with the neighbouring mini-golf project and
 * the installed Google Chrome, so nothing heavy is added to this repo.
 */
import { createRequire } from 'node:module'
import { JOURNEY_LEVELS } from '../src/levels/data.js'

const require = createRequire(import.meta.url)
const { chromium } = require('/Users/jonathanforrider/Programming/mini-golf-garden-finished/node_modules/playwright')

const url = process.argv[2] ?? 'http://localhost:4173/'
const level = JOURNEY_LEVELS[0]
const W = 640
const H = 940
const cell = Math.max(34, Math.min(80, Math.floor(Math.min(548 / level.width, 588 / level.height))))
const originX = Math.round((W - level.width * cell) / 2)
const originY = Math.round(140 + (588 - level.height * cell) / 2)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })

const errors = []
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForSelector('#game canvas')
await page.waitForTimeout(1200)

const rect = await page.evaluate(() => {
  const canvas = document.querySelector('#game canvas')
  const box = canvas.getBoundingClientRect()
  return { left: box.left, top: box.top, width: box.width, height: box.height }
})

const toPage = (x, y) => ({
  x: rect.left + (x / W) * rect.width,
  y: rect.top + (y / H) * rect.height,
})

console.log(`canvas ${Math.round(rect.width)}×${Math.round(rect.height)} at ${Math.round(rect.left)},${Math.round(rect.top)}`)
console.log(`level 1: ${level.width}×${level.height}, ${level.cats.length} cats, cell ${cell}px`)

// Enter starts Journey from the menu (keyboard shortcut in the menu scene).
await page.keyboard.press('Enter')
await page.waitForTimeout(900)
await page.screenshot({ path: '/tmp/purrfect-board.png' })

// Drag each known solution rectangle, as a player would.
const center = (x, y) => toPage(originX + (x + 0.5) * cell, originY + (y + 0.5) * cell)
for (const placement of level.solution) {
  const from = center(placement.x, placement.y)
  if (placement.width === 1 && placement.height === 1) {
    // One-square cats are placed with a tap, as the game allows.
    await page.mouse.click(from.x, from.y)
    await page.waitForTimeout(260)
    continue
  }
  const to = center(placement.x + placement.width - 1, placement.y + placement.height - 1)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(260)
}

await page.waitForTimeout(1800)
await page.screenshot({ path: '/tmp/purrfect-complete.png' })

const save = await page.evaluate(() => {
  try {
    return JSON.parse(localStorage.getItem('purrfect-squares-save-v1') ?? 'null')
  } catch {
    return null
  }
})

const checks = [
  ['page booted without errors', errors.length === 0],
  ['level 1 recorded as solved', Boolean(save?.stars?.[level.id])],
  ['level 2 unlocked', (save?.unlocked ?? 0) >= 2],
  ['completion counted', (save?.levelsCleared ?? 0) >= 1],
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`)
  if (!ok) failed += 1
}
if (errors.length > 0) {
  console.log('errors:')
  for (const error of errors) console.log(`  ${error}`)
}

await browser.close()
process.exit(failed === 0 ? 0 : 1)
