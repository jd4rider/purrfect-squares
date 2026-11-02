// Snapshot-based undo/redo. Placements are tiny plain objects, so copying the
// whole list is simpler — and much safer — than inverse operations.

export function createHistory(initial = []) {
  const past = []
  const future = []
  let current = initial.map(clonePlacement)

  return {
    get state() {
      return current.map(clonePlacement)
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    /** Replace the whole board and let undo return to it. */
    commit(next) {
      past.push(current.map(clonePlacement))
      current = next.map(clonePlacement)
      future.length = 0
      return current
    },
    undo() {
      if (past.length === 0) return current
      future.push(current.map(clonePlacement))
      current = past.pop()
      return current
    },
    redo() {
      if (future.length === 0) return current
      past.push(current.map(clonePlacement))
      current = future.pop()
      return current
    },
    reset(next = []) {
      past.length = 0
      future.length = 0
      current = next.map(clonePlacement)
      return current
    },
  }
}

export function clonePlacement(placement) {
  return {
    catId: placement.catId,
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
  }
}

/** Validating todays placements when restoring a save; drops anything corrupt. */
export function sanitizePlacements(level, placements) {
  if (!Array.isArray(placements)) return []
  const seen = new Set()
  const out = []
  for (const placement of placements) {
    if (!placement || typeof placement !== 'object') continue
    const { catId, x, y, width, height } = placement
    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(width) || !Number.isInteger(height)) continue
    if (width < 1 || height < 1 || width > 12 || height > 12) continue
    if (typeof catId !== 'string' || seen.has(catId)) continue
    seen.add(catId)
    out.push({ catId, x, y, width, height })
  }
  return out
}
