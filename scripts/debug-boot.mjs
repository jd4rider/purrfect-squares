#!/usr/bin/env node
// Boot diagnostics: print every console/page error and what the DOM looks like.
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('/Users/jonathanforrider/Programming/mini-golf-garden-finished/node_modules/playwright')

const url = process.argv[2] ?? 'http://localhost:4173/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 400, height: 860 } })
const logs = []
page.on('console', (message) => logs.push(`${message.type()}: ${message.text()}`))
page.on('pageerror', (error) => logs.push(`pageerror: ${error.stack ?? error.message}`))
page.on('requestfailed', (request) => logs.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`))

await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(2500)
console.log('--- logs ---')
console.log(logs.join('\n') || '(none)')
console.log('--- dom ---')
console.log((await page.evaluate(() => document.body.innerHTML)).slice(0, 600))
console.log('--- canvas count:', await page.evaluate(() => document.querySelectorAll('canvas').length))
await page.screenshot({ path: '/tmp/purrfect-boot.png' })
await browser.close()
