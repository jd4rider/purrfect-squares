// Bounded backtracking solver. It counts complete partitions up to a limit, so
// the generator can reject ambiguous boards without ever enumerating them all.

import { candidateRects, feasibleRects, gridOf } from './model.js'

const DEFAULT_NODES = 200000

/**
 * @returns {{
 *   count: number, nodes: number, truncated: boolean, invalid: boolean,
 *   totalCandidates: number, maxBranch: number, decisions: number
 * }}
 */
export function countSolutions(level, { limit = 2, maxNodes = DEFAULT_NODES } = {}) {
  const grid = gridOf(level)
  const cats = level.cats ?? []
  const totalCells = grid.cells.length
  const totalArea = cats.reduce((sum, cat) => sum + cat.area, 0)
  const stats = { count: 0, nodes: 0, truncated: false, invalid: false, totalCandidates: 0, maxBranch: 0, decisions: 0 }

  if (cats.length === 0 || totalArea !== totalCells) {
    stats.invalid = true
    return stats
  }

  const candidates = new Map()
  for (const cat of cats) {
    const list = candidateRects(level, cat)
    if (list.length === 0) {
      stats.invalid = true
      return stats
    }
    candidates.set(cat.id, list)
    stats.totalCandidates += list.length
  }

  // occ: 1 covered, 0 free, -1 not part of the board.
  const occ = new Int8Array(level.width * level.height).fill(-1)
  for (const cell of grid.cells) occ[cell.index] = 0

  const used = new Set()
  let covered = 0
  let count = 0

  const fits = (rect) => {
    for (const index of rect.cells) {
      if (occ[index] !== 0) return false
    }
    return true
  }

  const search = () => {
    if (stats.truncated) return
    stats.nodes += 1
    if (stats.nodes > maxNodes) {
      stats.truncated = true
      return
    }

    if (used.size === cats.length) {
      if (covered === totalCells) count += 1
      return
    }

    // Every placed cat covers exactly its area, so the free cells must equal
    // the area still to be placed. This prunes whole subtrees cheaply.
    let remainingArea = 0
    for (const cat of cats) {
      if (!used.has(cat.id)) remainingArea += cat.area
    }
    if (totalCells - covered !== remainingArea) return

    let best = null
    let bestList = null
    for (const cat of cats) {
      if (used.has(cat.id)) continue
      const list = candidates.get(cat.id).filter(fits)
      if (list.length === 0) return
      if (!bestList || list.length < bestList.length) {
        best = cat
        bestList = list
        if (list.length === 1) break
      }
    }

    if (bestList.length > stats.maxBranch) stats.maxBranch = bestList.length
    if (bestList.length > 1) stats.decisions += 1

    for (const rect of bestList) {
      used.add(best.id)
      for (const index of rect.cells) occ[index] = 1
      covered += rect.cells.length

      search()

      covered -= rect.cells.length
      for (const index of rect.cells) occ[index] = 0
      used.delete(best.id)

      if (stats.truncated || count >= limit) return
    }
  }

  search()
  stats.count = Math.min(count, limit)
  return stats
}

/** The first complete solution, or null. Used for hints and level verification. */
export function solve(level, { maxNodes = DEFAULT_NODES } = {}) {
  const grid = gridOf(level)
  const cats = level.cats ?? []
  const totalCells = grid.cells.length
  if (cats.reduce((sum, cat) => sum + cat.area, 0) !== totalCells) return null

  const candidates = new Map(cats.map((cat) => [cat.id, candidateRects(level, cat)]))
  const occ = new Int8Array(level.width * level.height).fill(-1)
  for (const cell of grid.cells) occ[cell.index] = 0

  const used = new Set()
  const chosen = []
  let covered = 0
  let nodes = 0

  const fits = (rect) => rect.cells.every((index) => occ[index] === 0)

  const search = () => {
    if (nodes > maxNodes) return false
    nodes += 1
    if (used.size === cats.length) return covered === totalCells

    let best = null
    let bestList = null
    for (const cat of cats) {
      if (used.has(cat.id)) continue
      const list = candidates.get(cat.id).filter(fits)
      if (list.length === 0) return false
      if (!bestList || list.length < bestList.length) {
        best = cat
        bestList = list
        if (list.length === 1) break
      }
    }

    for (const rect of bestList) {
      used.add(best.id)
      chosen.push(rect)
      for (const index of rect.cells) occ[index] = 1
      covered += rect.cells.length

      if (search()) return true

      covered -= rect.cells.length
      for (const index of rect.cells) occ[index] = 0
      chosen.pop()
      used.delete(best.id)
    }
    return false
  }

  if (!search()) return null
  return chosen.map(({ catId, x, y, width, height }) => ({ catId, x, y, width, height }))
}

/**
 * A cat worth hinting about: an unplaced one with the fewest remaining options.
 * Ties break toward the larger area, which is easier to reason about.
 */
export function mostConstrainedCat(level, placements) {
  const grid = gridOf(level)
  const placed = new Set((placements ?? []).map((placement) => placement.catId))
  let best = null
  let bestCount = Infinity
  for (const cat of level.cats ?? []) {
    if (placed.has(cat.id)) continue
    const count = feasibleCount(level, placements, cat.id)
    if (count < bestCount || (count === bestCount && best && cat.area > best.area)) {
      best = cat
      bestCount = count
    }
  }
  return best ? { cat: best, options: bestCount } : null
}

function feasibleCount(level, placements, catId) {
  const list = feasibleRects(level, placements, catId)
  // A dead end is still worth pointing at, but report it as 99 options so it is
  // never preferred over a genuinely forced cat.
  return list.length === 0 ? 99 : list.length
}
