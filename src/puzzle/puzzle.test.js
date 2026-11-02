import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  candidateRects,
  coveredIndices,
  feasibleRects,
  gridOf,
  isComplete,
  normalizeRect,
  placementAt,
  progressOf,
  rectArea,
  rectCells,
  validatePlacement,
} from './model.js'
import { countSolutions, mostConstrainedCat, solve } from './solver.js'
import { evaluateDifficulty, generatePuzzle, hashSeed, makeMask, rngFor } from './generator.js'
import { createHistory, sanitizePlacements } from './history.js'

/** Four 2×2 quadrants, one cat per quadrant: forced, and unique. */
function quadrantLevel() {
  return {
    id: 'test-quadrants',
    width: 4,
    height: 4,
    mask: ['####', '####', '####', '####'],
    cats: [
      { id: 'a', x: 0, y: 0, area: 4, coat: 'ginger' },
      { id: 'b', x: 2, y: 0, area: 4, coat: 'grey' },
      { id: 'c', x: 0, y: 2, area: 4, coat: 'black' },
      { id: 'd', x: 2, y: 2, area: 4, coat: 'cream' },
    ],
  }
}

const solutionOf = () => [
  { catId: 'a', x: 0, y: 0, width: 2, height: 2 },
  { catId: 'b', x: 2, y: 0, width: 2, height: 2 },
  { catId: 'c', x: 0, y: 2, width: 2, height: 2 },
  { catId: 'd', x: 2, y: 2, width: 2, height: 2 },
]

const place = (catId, x, y, width, height) => ({ catId, x, y, width, height })

test('rectangles normalise from any drag direction', () => {
  const fromTopLeft = normalizeRect({ x: 1, y: 1 }, { x: 3, y: 2 })
  const fromBottomRight = normalizeRect({ x: 3, y: 2 }, { x: 1, y: 1 })
  assert.deepEqual(fromTopLeft, fromBottomRight)
  assert.deepEqual(fromTopLeft, { x: 1, y: 1, width: 3, height: 2 })
  assert.equal(rectArea(fromTopLeft), 6)
  assert.equal(rectCells(fromTopLeft).length, 6)
})

test('a single cell is a valid rectangle', () => {
  assert.deepEqual(normalizeRect({ x: 2, y: 2 }, { x: 2, y: 2 }), { x: 2, y: 2, width: 1, height: 1 })
})

test('the grid exposes playable cells and cat positions', () => {
  const grid = gridOf(quadrantLevel())
  assert.equal(grid.cells.length, 16)
  assert.equal(grid.catAt.get(10), 'd')
  assert.equal(grid.playable.has(15), true)
})

test('the known partition validates and completes the board', () => {
  const level = quadrantLevel()
  for (const placement of solutionOf()) {
    assert.equal(validatePlacement(level, [], placement).ok, true)
  }
  assert.equal(isComplete(level, solutionOf()), true)
})

test('wrong area is rejected', () => {
  const result = validatePlacement(quadrantLevel(), [], place('a', 0, 0, 2, 1))
  assert.equal(result.ok, false)
  assert.equal(result.error, 'WRONG_AREA')
})

test('a rectangle that misses its cat is rejected', () => {
  const result = validatePlacement(quadrantLevel(), [], place('a', 1, 1, 2, 2))
  assert.equal(result.ok, false)
  assert.equal(result.error, 'MISSING_CAT')
})

test('a rectangle holding two cats is rejected', () => {
  // 1×4 along the top row contains both the left and right cat.
  const result = validatePlacement(quadrantLevel(), [], place('a', 0, 0, 4, 1))
  assert.equal(result.ok, false)
  assert.equal(result.error, 'MULTIPLE_CATS')
})

test('a rectangle leaving the board is rejected', () => {
  const result = validatePlacement(quadrantLevel(), [], place('a', -1, 0, 2, 2))
  assert.equal(result.ok, false)
  assert.equal(result.error, 'OUT_OF_BOUNDS')
})

test('holes in the board are not playable', () => {
  const level = {
    width: 3,
    height: 3,
    mask: ['###', '#.#', '###'],
    cats: [{ id: 'a', x: 0, y: 0, area: 4, coat: 'ginger' }],
  }
  assert.equal(validatePlacement(level, [], place('a', 0, 0, 2, 2)).error, 'OUT_OF_BOUNDS')
})

test('placements cannot overlap', () => {
  const level = {
    width: 4,
    height: 4,
    mask: ['####', '####', '####', '####'],
    cats: [
      { id: 'a', x: 0, y: 0, area: 8, coat: 'ginger' },
      { id: 'b', x: 3, y: 3, area: 8, coat: 'grey' },
    ],
  }
  // b takes the bottom two rows; a's 2×4 column would collide with it.
  const existing = [place('b', 0, 2, 4, 2)]
  const result = validatePlacement(level, existing, place('a', 0, 0, 2, 4))
  assert.equal(result.ok, false)
  assert.equal(result.error, 'OVERLAP')
})

test('completion needs every cell covered exactly once', () => {
  const level = quadrantLevel()
  assert.equal(isComplete(level, []), false)
  assert.equal(isComplete(level, solutionOf().slice(0, 3)), false)
  assert.equal(isComplete(level, [...solutionOf().slice(0, 3), place('d', 2, 2, 2, 2)]), true)
  // Two rectangles for the same cat cannot stand in for a missing one.
  assert.equal(isComplete(level, [place('a', 0, 0, 2, 2), place('a', 2, 0, 2, 2), ...solutionOf().slice(2)]), false)
})

test('progress and covered cells track placements', () => {
  const level = quadrantLevel()
  const placements = [place('a', 0, 0, 2, 2)]
  assert.equal(coveredIndices(level, placements).size, 4)
  assert.equal(progressOf(level, placements).covered, 4)
  assert.equal(progressOf(level, placements).total, 16)
  assert.equal(progressOf(level, placements).fraction, 0.25)
})

test('placementAt finds the rectangle under a cell', () => {
  const level = quadrantLevel()
  const placements = [place('a', 0, 0, 2, 2)]
  assert.equal(placementAt(level, placements, 1, 1)?.catId, 'a')
  assert.equal(placementAt(level, placements, 2, 2), null)
})

test('candidate rectangles respect area, board and other cats', () => {
  const level = quadrantLevel()
  const [a] = level.cats
  const candidates = candidateRects(level, a)
  assert.ok(candidates.length >= 1)
  for (const candidate of candidates) {
    assert.equal(candidate.width * candidate.height, a.area)
    assert.equal(candidate.catId, 'a')
    assert.ok(candidate.x <= a.x && candidate.y <= a.y)
    assert.ok(candidate.x + candidate.width > a.x && candidate.y + candidate.height > a.y)
  }
  // The 1×4 top row would swallow the neighbouring cat, so it is not offered.
  assert.ok(candidates.every((candidate) => !(candidate.width === 4 && candidate.y === 0)))
})

test('feasible rectangles shrink as the board fills', () => {
  const level = quadrantLevel()
  const before = feasibleRects(level, [], 'b').length
  const after = feasibleRects(level, [place('c', 0, 2, 2, 2)], 'b').length
  assert.ok(before >= after)
  assert.ok(after >= 1)
})

test('the solver finds exactly one solution for a forced board', () => {
  const stats = countSolutions(quadrantLevel(), { limit: 2 })
  assert.equal(stats.invalid, false)
  assert.equal(stats.truncated, false)
  assert.equal(stats.count, 1)
})

test('the solver detects ambiguity', () => {
  const level = {
    width: 4,
    height: 4,
    mask: ['####', '####', '####', '####'],
    cats: [
      { id: 'a', x: 0, y: 0, area: 8, coat: 'ginger' },
      { id: 'b', x: 3, y: 3, area: 8, coat: 'grey' },
    ],
  }
  const stats = countSolutions(level, { limit: 2 })
  assert.equal(stats.count, 2)
})

test('the solver rejects impossible area sums', () => {
  const level = quadrantLevel()
  level.cats[0].area = 5
  const stats = countSolutions(level, { limit: 2 })
  assert.equal(stats.invalid, true)
  assert.equal(stats.count, 0)
})

test('solve returns a placement list that completes the puzzle', () => {
  const level = quadrantLevel()
  const solution = solve(level)
  assert.ok(solution)
  assert.equal(isComplete(level, solution), true)
  assert.equal(solution.length, 4)
})

test('hints target the most constrained unplaced cat', () => {
  const level = quadrantLevel()
  const first = mostConstrainedCat(level, [])
  assert.ok(first)
  assert.equal(first.options, 1)
  const placed = solutionOf().find((placement) => placement.catId === first.cat.id)
  const second = mostConstrainedCat(level, [placed])
  assert.ok(second)
  assert.notEqual(second.cat.id, first.cat.id)
})

test('undo and redo restore every intermediate board', () => {
  const history = createHistory()
  history.commit([place('a', 0, 0, 2, 2)])
  history.commit([place('a', 0, 0, 2, 2), place('c', 0, 2, 2, 2)])
  assert.equal(history.state.length, 2)
  assert.equal(history.undo().length, 1)
  assert.equal(history.undo().length, 0)
  assert.equal(history.canUndo(), false)
  assert.equal(history.redo().length, 1)
  assert.equal(history.canRedo(), true)
  history.commit([place('b', 2, 0, 2, 2)])
  assert.equal(history.canRedo(), false)
})

test('history never leaks references to its snapshot', () => {
  const history = createHistory()
  const next = [place('a', 0, 0, 2, 2)]
  history.commit(next)
  next[0].x = 99
  assert.equal(history.state[0].x, 0)
})

test('saved placements are sanitised', () => {
  assert.deepEqual(
    sanitizePlacements(quadrantLevel(), [
      place('a', 0, 0, 2, 2),
      place('a', 2, 0, 2, 2),
      { catId: 'b', x: 0.5, y: 0, width: 2, height: 2 },
      null,
      place('c', 0, 2, 2, 2),
    ]),
    [place('a', 0, 0, 2, 2), place('c', 0, 2, 2, 2)],
  )
})

test('the PRNG is deterministic per seed', () => {
  const a = rngFor('garden')
  const b = rngFor('garden')
  for (let index = 0; index < 20; index += 1) assert.equal(a(), b())
  assert.equal(hashSeed('garden'), hashSeed('garden'))
  assert.notEqual(hashSeed('garden'), hashSeed('cottage'))
})

test('mask shapes keep their board dimensions', () => {
  for (const shape of ['rect', 'l', 't', 'z', 'stairs', 'cross', 'u', 'blob']) {
    const mask = makeMask(6, 6, shape, rngFor(shape))
    assert.equal(mask.length, 6)
    assert.ok(mask.some((row) => row.includes('#')))
    assert.ok(mask.every((row) => row.length === 6))
  }
})

test('difficulty rises with a richer search space', () => {
  const easy = { width: 4, height: 4, mask: ['####', '####', '####', '####'], cats: [] }
  const hard = { width: 8, height: 8, mask: ['########', '########', '########', '########', '########', '########', '########', '########'], cats: [] }
  const easyScore = evaluateDifficulty({ ...easy, cats: Array.from({ length: 4 }, () => ({})) }, {
    totalCandidates: 8,
    maxBranch: 1,
  })
  const hardScore = evaluateDifficulty({ ...hard, cats: Array.from({ length: 12 }, () => ({})) }, {
    totalCandidates: 120,
    maxBranch: 4,
  })
  assert.ok(hardScore > easyScore)
})

test('generation is deterministic and unique', () => {
  const options = { seed: 'unit-a', width: 5, height: 5, shape: 'rect', minCats: 4, maxCats: 6, attempts: 80 }
  const first = generatePuzzle(options)
  const second = generatePuzzle(options)
  assert.ok(first, 'expected a generated puzzle')
  assert.deepEqual(first.level.cats, second.level.cats)
  assert.deepEqual(first.level.mask, second.level.mask)
  assert.equal(isComplete(first.level, first.solution), true)
  assert.equal(countSolutions(first.level, { limit: 2 }).count, 1)
})
