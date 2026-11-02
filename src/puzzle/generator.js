// Deterministic level generation: partition a board mask into rectangles, put
// one cat in each, then keep the board only if the clues admit exactly one
// solution. Nothing is published without passing countSolutions().

import { countSolutions } from './solver.js'

export function hashSeed(text) {
  let hash = 2166136261
  for (let index = 0; index < String(text).length; index += 1) {
    hash ^= String(text).charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Small deterministic PRNG (mulberry32). Same seed, same board, every time. */
export function rngFor(seed) {
  let state = hashSeed(seed) || 1
  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)]

/**
 * Carve a named silhouette out of a width×height box. Always returns a mask
 * with at least one cell; the partition step does the rest.
 */
export function makeMask(width, height, shape, rng) {
  const on = Array.from({ length: height }, () => Array.from({ length: width }, () => '#'))
  const clear = (x0, y0, w, h) => {
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        if (on[y]?.[x] !== undefined) on[y][x] = '.'
      }
    }
  }

  const halfW = Math.max(1, Math.floor(width / 2))
  const halfH = Math.max(1, Math.floor(height / 2))

  switch (shape) {
    case 'l':
      clear(0, 0, halfW, halfH)
      break
    case 't':
      clear(0, 0, halfW, halfH)
      clear(width - halfW, 0, halfW, halfH)
      break
    case 'z':
      clear(0, 0, halfW, halfH)
      clear(width - halfW, height - halfH, halfW, halfH)
      break
    case 'stairs': {
      const step = Math.max(1, Math.round(width / 3))
      for (let row = 0; row < height; row += 1) {
        const cut = Math.min(width - 1, Math.floor((row + 1) / 2) * step)
        clear(0, row, Math.min(cut, width - 1), 1)
      }
      break
    }
    case 'cross': {
      const insetW = Math.max(1, Math.floor(width / 4))
      const insetH = Math.max(1, Math.floor(height / 4))
      clear(0, 0, insetW, insetH)
      clear(width - insetW, 0, insetW, insetH)
      clear(0, height - insetH, insetW, insetH)
      clear(width - insetW, height - insetH, insetW, insetH)
      break
    }
    case 'u': {
      const gapW = Math.max(1, width - halfW * 2)
      if (gapW > 0) clear(halfW, 0, gapW, halfH)
      break
    }
    case 'blob': {
      const bites = 1 + Math.floor(rng() * 3)
      for (let index = 0; index < bites; index += 1) {
        const edge = Math.floor(rng() * 4)
        const size = 1 + Math.floor(rng() * 2)
        if (edge === 0) clear(0, 0, size, size)
        else if (edge === 1) clear(width - size, 0, size, size)
        else if (edge === 2) clear(0, height - size, size, size)
        else clear(width - size, height - size, size, size)
      }
      break
    }
    default:
      break
  }

  const mask = on.map((row) => row.join(''))
  return mask.some((row) => row.includes('#')) ? mask : Array.from({ length: height }, () => '#'.repeat(width))
}

const maskCells = (mask) => {
  const cells = []
  for (let y = 0; y < mask.length; y += 1) {
    for (let x = 0; x < mask[y].length; x += 1) {
      if (mask[y][x] === '#') cells.push({ x, y })
    }
  }
  return cells
}

/**
 * Random rectangle tiling of the mask. Rectangles are grown from a random free
 * cell, which keeps the shapes varied instead of a uniform grid.
 */
export function partition(mask, width, height, rng) {
  const free = new Set()
  for (const cell of maskCells(mask)) free.add(cell.y * width + cell.x)
  const rects = []
  let guard = 0

  while (free.size > 0 && guard < 4000) {
    guard += 1
    const index = pick(rng, [...free])
    const start = { x: index % width, y: Math.floor(index / width) }
    let best = null

    for (let attempt = 0; attempt < 14; attempt += 1) {
      const width4 = 1 + Math.floor(rng() * Math.min(4, width))
      const height4 = 1 + Math.floor(rng() * Math.min(4, height))
      // Bias away from 1x1 slivers: they make boards dull and ambiguous.
      const area = width4 * height4
      if (area === 1 && rng() < 0.85) continue

      for (let tries = 0; tries < 4; tries += 1) {
        const x = start.x - Math.floor(rng() * width4)
        const y = start.y - Math.floor(rng() * height4)
        const rect = { x, y, width: width4, height: height4 }
        if (!rectFits(rect, width, height, free)) continue
        if (!best || rect.width * rect.height > best.width * best.height) best = rect
        break
      }
    }

    if (!best) best = { x: start.x, y: start.y, width: 1, height: 1 }
    for (let dy = 0; dy < best.height; dy += 1) {
      for (let dx = 0; dx < best.width; dx += 1) free.delete((best.y + dy) * width + (best.x + dx))
    }
    rects.push(best)
  }

  return rects
}

function rectFits(rect, width, height, free) {
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > width || rect.y + rect.height > height) return false
  for (let dy = 0; dy < rect.height; dy += 1) {
    for (let dx = 0; dx < rect.width; dx += 1) {
      if (!free.has((rect.y + dy) * width + (rect.x + dx))) return false
    }
  }
  return true
}

/** Difficulty from measurable search structure, not just board size. */
export function evaluateDifficulty(level, stats) {
  const cats = level.cats.length
  const gridCells = level.mask.join('').split('').filter((cell) => cell === '#').length
  const bbox = level.width * level.height
  const irregularity = bbox === 0 ? 0 : 1 - gridCells / bbox
  const richness = stats.totalCandidates / Math.max(1, cats)
  const branching = Math.min(4, stats.maxBranch)

  const score = cats * 0.85 + Math.min(3.2, richness / 2.4) + irregularity * 1.6 + branching * 0.55
  if (score < 6.2) return 1
  if (score < 7.6) return 2
  if (score < 8.9) return 3
  if (score < 10.2) return 4
  return 5
}

export const DIFFICULTY_NAMES = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert']

const COATS = ['ginger', 'grey', 'black', 'cream', 'calico', 'tuxedo', 'blue']

/**
 * Generate one validated puzzle. Returns null when no unique partition was
 * found inside the attempt/node budget — callers must handle that instead of
 * shipping a puzzle they could not verify.
 */
export function generatePuzzle({
  seed = 'seed',
  width = 6,
  height = 6,
  shape = 'rect',
  minCats = 6,
  maxCats = 9,
  attempts = 60,
  maxNodes = 120000,
} = {}) {
  const rng = rngFor(`${seed}|${width}x${height}|${shape}`)

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const mask = makeMask(width, height, attempt === 0 ? shape : shape, rng)
    const cells = maskCells(mask)
    const rects = partition(mask, width, height, rng)
    if (rects.length < minCats || rects.length > maxCats) continue
    if (rects.some((rect) => rect.width * rect.height > 12)) continue

    const cats = rects.map((rect, index) => {
      const x = rect.x + Math.floor(rng() * rect.width)
      const y = rect.y + Math.floor(rng() * rect.height)
      return {
        id: `c${index + 1}`,
        x,
        y,
        area: rect.width * rect.height,
        coat: COATS[Math.floor(rng() * COATS.length)],
      }
    })

    const level = {
      id: '',
      name: '',
      width,
      height,
      mask,
      cats,
      seed: `${seed}#${attempt}`,
    }

    const stats = countSolutions(level, { limit: 2, maxNodes })
    if (stats.truncated || stats.count !== 1) continue

    const solution = rects.map((rect, index) => ({
      catId: `c${index + 1}`,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }))

    return {
      level: { ...level, difficulty: evaluateDifficulty(level, stats) },
      solution,
      stats,
      attempts: attempt + 1,
    }
  }

  return null
}
