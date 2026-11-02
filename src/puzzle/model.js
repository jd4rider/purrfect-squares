// Pure rectangle-partitioning rules. No rendering, no storage: the same code
// validates a player's drag, drives the solver and checks generated levels.

export const ERROR_TEXT = {
  INVALID_RECTANGLE: 'That is not a rectangle.',
  WRONG_AREA: 'The area does not match the number.',
  MISSING_CAT: 'The rectangle has to include its cat.',
  MULTIPLE_CATS: 'Only one cat fits in a rectangle.',
  OUT_OF_BOUNDS: 'The rectangle leaves the board.',
  OVERLAP: 'Those squares are already used.',
  ALREADY_PLACED: 'That cat already has a rectangle.',
}

export const isInt = (value) => Number.isInteger(value)

/** Normalise a drag between two cells into a top-left anchored rectangle. */
export function normalizeRect(a, b) {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.abs(a.x - b.x) + 1,
    height: Math.abs(a.y - b.y) + 1,
  }
}

export function rectCells(rect) {
  const cells = []
  for (let dy = 0; dy < rect.height; dy += 1) {
    for (let dx = 0; dx < rect.width; dx += 1) {
      cells.push({ x: rect.x + dx, y: rect.y + dy })
    }
  }
  return cells
}

export function rectContains(rect, x, y) {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.width && y < rect.y + rect.height
}

export function rectArea(rect) {
  return rect.width * rect.height
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

const gridCache = new WeakMap()

/**
 * Derived, read-only view of a level: which cells exist, which cat sits where.
 * `level.mask` is an array of rows; `#` marks a playable cell.
 */
export function gridOf(level) {
  const cached = gridCache.get(level)
  if (cached) return cached

  const width = level.width
  const height = level.height
  const playable = new Set()
  const cells = []
  for (let y = 0; y < height; y += 1) {
    const row = level.mask?.[y] ?? ''
    for (let x = 0; x < width; x += 1) {
      if (row[x] !== '#') continue
      const index = y * width + x
      playable.add(index)
      cells.push({ x, y, index })
    }
  }

  const catAt = new Map()
  for (const cat of level.cats ?? []) {
    const index = cat.y * width + cat.x
    if (playable.has(index)) catAt.set(index, cat.id)
  }

  const grid = {
    width,
    height,
    playable,
    cells,
    catAt,
    byId: new Map((level.cats ?? []).map((cat) => [cat.id, cat])),
    indexOf: (x, y) => y * width + x,
    inBounds: (x, y) => x >= 0 && y >= 0 && x < width && y < height,
  }
  gridCache.set(level, grid)
  return grid
}

/** Cells a [x,y] pair addresses, or null when the pointer is off the board. */
export function cellAt(level, x, y) {
  const grid = gridOf(level)
  if (!grid.inBounds(x, y)) return null
  return { x, y, playable: grid.playable.has(y * level.width + x) }
}

/**
 * Validate one rectangle against the level and the rectangles already placed.
 * Returns `{ ok: true }` or `{ ok: false, error, message }`.
 */
export function validatePlacement(level, existing, candidate) {
  const fail = (error) => ({ ok: false, error, message: ERROR_TEXT[error] })

  if (!candidate || !isInt(candidate.x) || !isInt(candidate.y)) return fail('INVALID_RECTANGLE')
  if (!isInt(candidate.width) || !isInt(candidate.height) || candidate.width < 1 || candidate.height < 1) {
    return fail('INVALID_RECTANGLE')
  }

  const grid = gridOf(level)
  const cat = grid.byId.get(candidate.catId)
  if (!cat) return fail('MISSING_CAT')

  if (rectArea(candidate) !== cat.area) return fail('WRONG_AREA')
  if (!rectContains(candidate, cat.x, cat.y)) return fail('MISSING_CAT')
  if (candidate.x < 0 || candidate.y < 0 || candidate.x + candidate.width > level.width || candidate.y + candidate.height > level.height) {
    return fail('OUT_OF_BOUNDS')
  }

  for (const cell of rectCells(candidate)) {
    if (!grid.playable.has(cell.y * level.width + cell.x)) return fail('OUT_OF_BOUNDS')
  }

  for (const cell of rectCells(candidate)) {
    const other = grid.catAt.get(cell.y * level.width + cell.x)
    if (other && other !== candidate.catId) return fail('MULTIPLE_CATS')
  }

  for (const placed of existing ?? []) {
    if (!placed || placed.catId === candidate.catId) continue
    if (rectsOverlap(placed, candidate)) return fail('OVERLAP')
  }

  return { ok: true }
}

/** Everything placed, every playable cell covered exactly once. */
export function isComplete(level, placements) {
  const grid = gridOf(level)
  const cats = level.cats ?? []
  if ((placements ?? []).length !== cats.length) return false

  const seenCats = new Set()
  const covered = new Set()
  for (const placement of placements) {
    if (!placement || seenCats.has(placement.catId)) return false
    seenCats.add(placement.catId)
    const result = validatePlacement(level, placements.filter((other) => other !== placement), placement)
    if (!result.ok) return false
    for (const cell of rectCells(placement)) {
      const index = cell.y * level.width + cell.x
      if (!grid.playable.has(index) || covered.has(index)) return false
      covered.add(index)
    }
  }
  return covered.size === grid.playable.size
}

/** Cells covered by the current placements, as a Set of board indices. */
export function coveredIndices(level, placements) {
  const covered = new Set()
  for (const placement of placements ?? []) {
    for (const cell of rectCells(placement)) covered.add(cell.y * level.width + cell.x)
  }
  return covered
}

/** The placement covering a cell, if any. Used for tap-to-remove. */
export function placementAt(level, placements, x, y) {
  for (const placement of placements ?? []) {
    if (rectContains(placement, x, y)) return placement
  }
  return null
}

export function progressOf(level, placements) {
  const grid = gridOf(level)
  const covered = coveredIndices(level, placements)
  return {
    covered: covered.size,
    total: grid.playable.size,
    fraction: grid.playable.size === 0 ? 0 : covered.size / grid.playable.size,
  }
}

/**
 * Every rectangle of the cat's area that sits on the board, contains the cat
 * and holds no other cat. Placement-independent; the solver filters by overlap.
 */
export function candidateRects(level, cat) {
  const grid = gridOf(level)
  const out = []
  const area = cat.area
  if (!isInt(area) || area < 1) return out

  for (let width = 1; width <= area; width += 1) {
    if (area % width !== 0) continue
    const height = area / width
    if (width > level.width || height > level.height) continue

    for (let x = cat.x - width + 1; x <= cat.x; x += 1) {
      for (let y = cat.y - height + 1; y <= cat.y; y += 1) {
        if (x < 0 || y < 0 || x + width > level.width || y + height > level.height) continue
        const cells = []
        let fits = true
        for (let dy = 0; dy < height && fits; dy += 1) {
          for (let dx = 0; dx < width; dx += 1) {
            const index = (y + dy) * level.width + (x + dx)
            if (!grid.playable.has(index)) {
              fits = false
              break
            }
            cells.push(index)
          }
        }
        if (!fits) continue
        if (cells.some((index) => grid.catAt.has(index) && grid.catAt.get(index) !== cat.id)) continue
        out.push({ catId: cat.id, x, y, width, height, cells })
      }
    }
  }
  return out
}

/** Candidate rectangles that are still free given the current board. */
export function feasibleRects(level, placements, catId) {
  const grid = gridOf(level)
  const occupied = new Set()
  for (const placement of placements ?? []) {
    if (placement.catId === catId) continue
    for (const cell of rectCells(placement)) occupied.add(cell.y * level.width + cell.x)
  }
  const cat = grid.byId.get(catId)
  if (!cat) return []
  return candidateRects(level, cat).filter((rect) => rect.cells.every((index) => !occupied.has(index)))
}
