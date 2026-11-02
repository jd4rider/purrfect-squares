#!/usr/bin/env node
// Confirms the arcade portal lists the game and opens its detail page.
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('/Users/jonathanforrider/Programming/mini-golf-garden-finished/node_modules/playwright')

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))

await page.goto('https://littlejoyarcade.site/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
const listed = await page.getByText('Purrfect Squares').count()

await page.goto('https://littlejoyarcade.site/#/game/purrfect-squares', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
const heading = await page.locator('h1').first().textContent().catch(() => null)
const iframe = await page.locator('iframe').first().getAttribute('src').catch(() => null)
const playButton = await page.getByRole('link', { name: /play/i }).count()

await page.screenshot({ path: '/tmp/purrfect-portal.png', fullPage: false })

console.log(`listed on home: ${listed > 0}`)
console.log(`detail heading: ${heading?.trim()}`)
console.log(`iframe: ${iframe}`)
console.log(`play links: ${playButton}`)
console.log(`page errors: ${errors.length}${errors.length ? ` (${errors[0]})` : ''}`)
await browser.close()
process.exit(listed > 0 && errors.length === 0 ? 0 : 1)
