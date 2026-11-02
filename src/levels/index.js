// The playable catalogue: 200 baked Journey boards plus the generated modes.
// Generation is deterministic, so a daily puzzle is the same board for everyone
// on the same UTC date without shipping a separate daily table.

import { JOURNEY_LEVELS } from './data.js'
import { generatePuzzle } from '../puzzle/generator.js'

export const TOTAL_LEVELS = JOURNEY_LEVELS.length

export const CHAPTER_NAMES = [
  'Sunny Start',
  'Window Sills',
  'Cushion Corners',
  'Moonlit Mats',
  'Patchwork Paths',
  'Sugar Windows',
  'Palace Halls',
  'Purrfect Master',
]

function chapterName(number) {
  return CHAPTER_NAMES[number - 1] ?? `Chapter ${number}`
}

// Built after CHAPTER_NAMES is initialised: this module is evaluated eagerly, so
// referencing the array above from a top-level IIFE would hit the TDZ.
export const CHAPTERS = (() => {
  const map = new Map()
  for (const level of JOURNEY_LEVELS) {
    if (!map.has(level.chapter)) {
      map.set(level.chapter, {
        number: level.chapter,
        name: chapterName(level.chapter),
        levels: [],
      })
    }
    map.get(level.chapter).levels.push(level)
  }
  return [...map.values()]
})()

export function levelAt(number) {
  return JOURNEY_LEVELS[Math.max(0, Math.min(TOTAL_LEVELS - 1, number - 1))] ?? JOURNEY_LEVELS[0]
}

export function levelById(id) {
  return JOURNEY_LEVELS.find((level) => level.id === id) ?? null
}

export function levelNumber(level) {
  const index = JOURNEY_LEVELS.indexOf(level)
  return index >= 0 ? index + 1 : 0
}

export function chapterOf(level) {
  return CHAPTERS.find((chapter) => chapter.number === level?.chapter) ?? CHAPTERS[0]
}

export function isIrregular(level) {
  return level.mask.some((row) => row.includes('.'))
}

export const DAILY = Object.freeze({ width: 5, height: 5, shape: 'rect', minCats: 4, maxCats: 6 })
export const ZEN = Object.freeze({ width: 5, height: 5, shape: 'rect', minCats: 3, maxCats: 5 })
export const UNLIMITED = Object.freeze({ width: 6, height: 6, shape: 'rect', minCats: 5, maxCats: 8 })

/**
 * Generate a mode's board on demand. `attempts` and `maxNodes` are deliberately
 * modest so the UI stalls for tens of milliseconds, not seconds; a fallback
 * Journey board keeps the mode playable if generation ever gives up.
 */
function generate(seed, config, { attempts = 45, maxNodes = 60000 } = {}) {
  const generated = generatePuzzle({ ...config, seed, attempts, maxNodes })
  if (!generated) {
    const fallback = levelAt((Math.abs(seed.length * 37) % TOTAL_LEVELS) + 1)
    return { level: { ...fallback, id: `fallback-${seed}` }, solution: fallback.solution, fallback: true }
  }
  return { level: { ...generated.level, id: seed, name: prettyName(seed) }, solution: generated.solution, fallback: false }
}

function prettyName(seed) {
  if (seed.startsWith('daily-')) return 'Daily Catnap'
  if (seed.startsWith('zen-')) return 'Zen Cushion'
  if (seed.startsWith('expert-')) return 'Expert Whiskers'
  return 'Unlimited Nap'
}

export function todayUTC() {
  return new Date().toISOString().slice(0, 10)
}

export function dailyPuzzle(date = todayUTC()) {
  return { ...generate(`daily-${date}`, DAILY, { attempts: 60, maxNodes: 90000 }), date }
}

export function zenPuzzle(nonce = 0) {
  return generate(`zen-${nonce}`, ZEN, { attempts: 50 })
}

export function unlimitedPuzzle(nonce = 0) {
  return generate(`unlimited-${nonce}`, UNLIMITED, { attempts: 60, maxNodes: 90000 })
}

/** Expert mode replays the hardest Journey boards without changing them. */
export function expertPuzzle(nonce = 0) {
  const hard = JOURNEY_LEVELS.filter((level) => level.difficulty >= 4)
  const pool = hard.length > 0 ? hard : JOURNEY_LEVELS.slice(-25)
  const level = pool[Math.abs(nonce) % pool.length]
  return { level, solution: level.solution, fallback: false }
}
