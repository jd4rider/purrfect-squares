import Phaser from 'phaser'
import { W, H, background, catBlink, drawCat, fade, iconButton, starString, text, themeOf } from './common.js'
import { data, record, savePlacements } from '../save.js'
import { levelAt, levelNumber, isIrregular, dailyPuzzle, zenPuzzle, unlimitedPuzzle, expertPuzzle, todayUTC, TOTAL_LEVELS, chapterOf } from '../levels/index.js'
import {
  gridOf,
  isComplete,
  normalizeRect,
  placementAt,
  progressOf,
  validatePlacement,
} from '../puzzle/model.js'
import { createHistory } from '../puzzle/history.js'
import { mostConstrainedCat } from '../puzzle/solver.js'
import { newlyUnlocked, starsFor } from '../progress.js'
import { sfx } from '../sound.js'

const PASTELS = [0xf3a683, 0x8fc6e8, 0xf2c879, 0xb9a3e0, 0x8fd4b8, 0xefa8c3, 0xc9d98b, 0x9fb6e8]

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  init(payload = {}) {
    this.payload = payload
    this.mode = payload.mode ?? 'journey'
    this.hints = 0
    this.resets = 0
    this.locked = false
    this.anchor = null
    this.down = null
    this.dragging = false
    this.cursor = { x: 0, y: 0 }
  }

  create() {
    if (this.input) this.input.enabled = true
    this.theme = themeOf(data.settings.theme)
    const board = this.resolveBoard()
    this.level = board.level
    this.solution = board.solution
    this.levelNumber = board.levelNumber ?? 0
    this.date = board.date ?? null
    this.grid = gridOf(this.level)

    const stored = this.mode === 'journey' && this.level.id ? data.placements[this.level.id] : null
    this.history = createHistory(stored ? this.sanitize(stored) : [])
    this.hintStage = 0

    background(this, this.theme, { reducedMotion: data.settings.reducedMotion })
    this.cameras.main.fadeIn(160, 12, 10, 20)

    this.layoutBoard()
    this.drawTray()
    this.drawTiles()
    this.createCats()
    this.createLayers()
    this.createHud()
    this.bindInput()

    this.redrawPlacements()
    this.refreshHud()
    this.afterChange({ save: false })
  }

  resolveBoard() {
    if (this.mode === 'daily') {
      const puzzle = dailyPuzzle(this.payload.date ?? todayUTC())
      return { level: puzzle.level, solution: puzzle.solution, levelNumber: 0, date: puzzle.date }
    }
    if (this.mode === 'zen') {
      const puzzle = zenPuzzle(this.payload.nonce ?? 0)
      return { level: puzzle.level, solution: puzzle.solution, levelNumber: 0 }
    }
    if (this.mode === 'unlimited') {
      const puzzle = unlimitedPuzzle(this.payload.nonce ?? 0)
      return { level: puzzle.level, solution: puzzle.solution, levelNumber: 0 }
    }
    if (this.mode === 'expert') {
      const puzzle = expertPuzzle(this.payload.nonce ?? 0)
      return { level: puzzle.level, solution: puzzle.solution, levelNumber: levelNumber(puzzle.level) }
    }
    const number = Math.max(1, Math.min(TOTAL_LEVELS, this.payload.level ?? data.unlocked))
    const level = levelAt(number)
    return { level, solution: level.solution, levelNumber: number }
  }

  sanitize(placements) {
    // Keep only placements that still describe this exact board.
    const out = []
    const seen = new Set()
    const cats = new Map(this.level.cats.map((cat) => [cat.id, cat]))
    for (const placement of placements) {
      const cat = cats.get(placement?.catId)
      if (!cat || seen.has(cat.id)) continue
      const candidate = { ...placement }
      if (!validatePlacement(this.level, out, candidate).ok) continue
      seen.add(cat.id)
      out.push(candidate)
    }
    return out
  }

  layoutBoard() {
    const { width, height } = this.level
    this.cell = Math.max(34, Math.min(80, Math.floor(Math.min(548 / width, 588 / height))))
    this.pixelW = this.cell * width
    this.pixelH = this.cell * height
    this.originX = Math.round((W - this.pixelW) / 2)
    this.originY = Math.round(140 + (588 - this.pixelH) / 2)
    this.trayX = this.originX - 14
    this.trayY = this.originY - 14
    this.trayW = this.pixelW + 28
    this.trayH = this.pixelH + 28
  }

  drawTray() {
    const theme = this.theme
    const g = this.add.graphics().setDepth(1)
    const x = this.trayX
    const y = this.trayY
    const w = this.trayW
    const h = this.trayH

    // Ambient shadow, then a faked extrusion: two darker slabs behind the face.
    g.fillStyle(theme.shadow, 0.24)
    g.fillRoundedRect(x + 6, y + 16, w, h, 26)
    g.fillStyle(theme.woodEdge, 1)
    g.fillRoundedRect(x, y + 10, w, h, 26)
    g.fillStyle(theme.woodDark, 1)
    g.fillRoundedRect(x, y + 5, w, h, 26)
    g.fillStyle(theme.wood, 1)
    g.fillRoundedRect(x, y, w, h, 26)
    // Rim highlight along the top and left.
    g.lineStyle(3, 0xffffff, theme.dark ? 0.1 : 0.28)
    g.beginPath()
    g.moveTo(x + 20, y + 3)
    g.lineTo(x + w - 20, y + 3)
    g.strokePath()
    // Recessed playfield.
    g.fillStyle(theme.recess, theme.dark ? 0.85 : 0.6)
    g.fillRoundedRect(x + 8, y + 9, w - 16, h - 18, 16)
  }

  drawTiles() {
    const theme = this.theme
    const g = this.add.graphics().setDepth(2)
    const cell = this.cell
    const radius = Math.max(6, Math.min(14, cell * 0.16))

    for (const { x, y } of this.grid.cells) {
      const px = this.originX + x * cell
      const py = this.originY + y * cell
      const inset = Math.max(2, cell * 0.04)

      g.fillStyle(theme.tileShadow, 0.5)
      g.fillRoundedRect(px + inset + 1, py + inset + 4, cell - inset * 2, cell - inset * 2, radius)
      g.fillStyle(theme.tileEdge, 1)
      g.fillRoundedRect(px + inset, py + inset + 2, cell - inset * 2, cell - inset * 2, radius)
      g.fillStyle(theme.tile, 1)
      g.fillRoundedRect(px + inset, py + inset, cell - inset * 2, cell - inset * 2 - 2, radius)
      // Top-left light, bottom-right shade: enough to read as a raised tile.
      g.lineStyle(Math.max(1.5, cell * 0.03), 0xffffff, theme.dark ? 0.14 : 0.6)
      g.beginPath()
      g.moveTo(px + inset + radius, py + inset + 2)
      g.lineTo(px + cell - inset - radius, py + inset + 2)
      g.strokePath()
      g.lineStyle(Math.max(1, cell * 0.02), theme.tileShadow, 0.3)
      g.beginPath()
      g.moveTo(px + inset + radius, py + cell - inset - 3)
      g.lineTo(px + cell - inset - radius, py + cell - inset - 3)
      g.strokePath()

      if (data.settings.showGrid) {
        g.lineStyle(1, theme.tileShadow, 0.12)
        g.strokeRoundedRect(px + inset, py + inset, cell - inset * 2, cell - inset * 2 - 2, radius)
      }
    }
  }

  createCats() {
    this.cats = []
    const size = Math.max(28, Math.round(this.cell * 0.7))
    for (const cat of this.level.cats) {
      const x = this.originX + (cat.x + 0.5) * this.cell
      const y = this.originY + (cat.y + 0.5) * this.cell
      const container = drawCat(this, x, y, size, cat, this.theme, { scale: 1 })
      container.setDepth(8)
      catBlink(this, container, data.settings.reducedMotion)
      this.cats.push({ cat, container, home: { x, y } })
    }
  }

  createLayers() {
    this.fillG = this.add.graphics().setDepth(4)
    this.outlineG = this.add.graphics().setDepth(5)
    this.previewG = this.add.graphics().setDepth(12)
    this.previewLabel = text(this, 0, 0, '', 14, '#ffffff', {
      fontStyle: 'bold',
      backgroundColor: 'rgba(20,16,12,0.72)',
      padding: { x: 8, y: 4 },
    })
      .setOrigin(0.5)
      .setDepth(13)
      .setVisible(false)
    this.hintG = this.add.graphics().setDepth(10)
  }

  createHud() {
    const theme = this.theme
    iconButton(this, 44, 46, '←', () => this.leave(), theme, { size: 46, depth: 20 })

    const chapter = this.mode === 'journey' ? chapterOf(this.level).name : this.modeName()
    const title = this.mode === 'journey' ? `Journey ${this.levelNumber} · ${this.level.name}` : `${this.modeName()}`
    this.titleText = text(this, W / 2, 34, title, 20, theme.text, { fontStyle: 'bold' }).setOrigin(0.5).setDepth(20)
    this.subText = text(this, W / 2, 60, chapter, 13, theme.subtext, { alpha: 0.9 }).setOrigin(0.5).setDepth(20)
    this.statsText = text(this, W / 2, 92, '', 14, theme.subtext, { fontStyle: 'bold' }).setOrigin(0.5).setDepth(20)

    const best = this.mode === 'journey' ? (data.stars[this.level.id] ?? 0) : 0
    text(this, W - 44, 46, best ? starString(best) : '☆', 16, theme.accent).setOrigin(0.5).setDepth(20)

    const difficulty = this.level.difficulty ?? 1
    const label = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'][difficulty] ?? 'Medium'
    text(this, W - 96, 76, label, 12, theme.subtext, { alpha: 0.85 }).setOrigin(1, 0.5).setDepth(20)
    text(this, W - 96, 96, `${this.level.cats.length} cats`, 12, theme.subtext, { alpha: 0.85 }).setOrigin(1, 0.5).setDepth(20)

    const glyphs = [
      { glyph: '↺', label: 'Undo', action: () => this.undo() },
      { glyph: '↻', label: 'Redo', action: () => this.redo() },
      { glyph: '💡', label: 'Hint', action: () => this.showHint() },
      { glyph: '⟲', label: 'Reset', action: () => this.resetBoard() },
    ]
    this.controlButtons = glyphs.map((item, index) => {
      const x = 146 + index * 116
      const box = iconButton(this, x, 790, item.glyph, item.action, theme, { size: 54, depth: 20 })
      text(this, x, 822, item.label, 11, theme.subtext, { alpha: 0.9 }).setOrigin(0.5).setDepth(20)
      return box
    })

    this.progressText = text(this, W / 2, 856, '', 14, theme.text, { fontStyle: 'bold' }).setOrigin(0.5).setDepth(20)
    this.barG = this.add.graphics().setDepth(20)
    this.messageText = text(this, W / 2, 742, '', 14, theme.accentText, {
      fontStyle: 'bold',
      backgroundColor: 'rgba(28,22,16,0.78)',
      padding: { x: 12, y: 6 },
    })
      .setOrigin(0.5)
      .setDepth(22)
      .setAlpha(0)

    text(this, W / 2, H - 26, 'Drag to draw · tap a rectangle to lift it · Z undo · H hint', 11, theme.subtext, {
      alpha: 0.65,
    })
      .setOrigin(0.5)
      .setDepth(20)
  }

  modeName() {
    return { daily: 'Daily Catnap', zen: 'Zen Cushion', unlimited: 'Unlimited Nap', expert: 'Expert Whiskers' }[this.mode] ?? 'Purrfect Squares'
  }

  bindInput() {
    this.input.on('pointerdown', (pointer) => this.onDown(pointer))
    this.input.on('pointermove', (pointer) => this.onMove(pointer))
    this.input.on('pointerup', (pointer) => this.onUp(pointer))
    this.input.on('pointerupoutside', () => this.clearGesture())

    const keyboard = this.input.keyboard
    if (!keyboard) return
    keyboard.on('keydown-ESC', () => this.leave())
    keyboard.on('keydown-Z', () => this.undo())
    keyboard.on('keydown-Y', () => this.redo())
    keyboard.on('keydown-H', () => this.showHint())
    keyboard.on('keydown-R', () => this.resetBoard())
    keyboard.on('keydown-LEFT', () => this.moveCursor(-1, 0))
    keyboard.on('keydown-RIGHT', () => this.moveCursor(1, 0))
    keyboard.on('keydown-UP', () => this.moveCursor(0, -1))
    keyboard.on('keydown-DOWN', () => this.moveCursor(0, 1))
    keyboard.on('keydown-ENTER', () => this.selectCursor())
    keyboard.on('keydown-SPACE', () => this.selectCursor())
  }

  moveCursor(dx, dy) {
    if (this.locked) return
    const next = { x: this.cursor.x + dx, y: this.cursor.y + dy }
    if (!this.grid.inBounds(next.x, next.y)) return
    this.cursor = next
    this.drawCursor()
  }

  selectCursor() {
    if (this.locked) return
    const cell = this.cursor
    if (!this.grid.playable.has(cell.y * this.level.width + cell.x)) return
    const existing = placementAt(this.level, this.history.state, cell.x, cell.y)
    if (existing) {
      this.removeCat(existing.catId)
      return
    }
    if (this.anchor && (this.anchor.x !== cell.x || this.anchor.y !== cell.y)) {
      this.attempt(this.anchor, cell)
      this.anchor = null
      this.clearPreview()
    } else {
      this.anchor = cell
      this.drawCursor()
      sfx.select()
    }
  }

  drawCursor() {
    this.hintG.clear()
    if (this.locked) return
    const cell = this.anchor ?? this.cursor
    const px = this.originX + cell.x * this.cell
    const py = this.originY + cell.y * this.cell
    this.hintG.lineStyle(3, this.theme.accent, this.anchor ? 0.95 : 0.4)
    this.hintG.strokeRoundedRect(px + 3, py + 3, this.cell - 6, this.cell - 6, 10)
  }

  pointerCell(pointer) {
    const x = Math.floor((pointer.x - this.originX) / this.cell)
    const y = Math.floor((pointer.y - this.originY) / this.cell)
    if (!this.grid.inBounds(x, y)) return null
    if (!this.grid.playable.has(y * this.level.width + x)) return null
    return { x, y }
  }

  onDown(pointer) {
    if (this.locked) return
    const cell = this.pointerCell(pointer)
    if (!cell) {
      this.anchor = null
      this.clearPreview()
      return
    }
    this.down = { cell, placement: placementAt(this.level, this.history.state, cell.x, cell.y) }
    this.dragging = false
    if (!this.down.placement) {
      this.anchor = cell
      this.drawCursor()
    }
    sfx.select()
  }

  onMove(pointer) {
    if (this.locked || !this.down || this.down.placement) return
    const cell = this.pointerCell(pointer)
    if (!cell) {
      this.clearPreview()
      return
    }
    if (cell.x !== this.down.cell.x || cell.y !== this.down.cell.y) this.dragging = true
    if (!this.dragging) return
    this.anchor = cell
    this.showPreview(this.down.cell, cell)
  }

  onUp(pointer) {
    if (this.locked || !this.down) {
      this.clearGesture()
      return
    }
    const cell = this.pointerCell(pointer) ?? this.down.cell
    const wasDragging = this.dragging
    const downCell = this.down.cell
    const existing = this.down.placement

    this.down = null
    this.dragging = false

    if (existing) {
      if (!wasDragging && cell && cell.x === downCell.x && cell.y === downCell.y) this.removeCat(existing.catId)
      this.anchor = null
      this.clearPreview()
      return
    }

    if (wasDragging && cell) {
      this.attempt(downCell, cell)
      this.anchor = null
      this.clearPreview()
      return
    }

    // Two-tap / keyboard flow: the first tap sets the corner, the second draws.
    const anchor = this.anchor
    if (anchor && (anchor.x !== cell.x || anchor.y !== cell.y)) {
      this.attempt(anchor, cell)
      this.anchor = null
      this.clearPreview()
      return
    }

    // A one-square cat has no rectangle to drag out, so a tap places it.
    const lone = this.level.cats.find((cat) => cat.area === 1 && cat.x === cell.x && cat.y === cell.y)
    if (lone) {
      this.attempt(cell, cell)
      this.anchor = null
      this.clearPreview()
      return
    }

    this.anchor = cell
    this.clearPreview()
    this.drawCursor()
  }

  clearGesture() {
    this.down = null
    this.dragging = false
    this.clearPreview()
    if (!this.anchor) this.hintG.clear()
  }

  showPreview(a, b) {
    const level = this.level
    const rect = normalizeRect(a, b)
    const cat = this.catInside(rect)
    const candidate = { catId: cat?.id ?? '__none__', ...rect }
    const result = cat ? validatePlacement(level, this.existingFor(cat.id), candidate) : { ok: false, error: 'MISSING_CAT' }

    this.previewG.clear()
    const px = this.originX + rect.x * this.cell
    const py = this.originY + rect.y * this.cell
    const w = rect.width * this.cell
    const h = rect.height * this.cell
    const color = result.ok ? 0x4f9d69 : 0xc0554b
    this.previewG.fillStyle(color, 0.22)
    this.previewG.fillRoundedRect(px + 3, py + 3, w - 6, h - 6, 10)
    this.previewG.lineStyle(3, color, 0.95)
    this.previewG.strokeRoundedRect(px + 3, py + 3, w - 6, h - 6, 10)

    this.previewLabel
      .setText(`${rect.width}×${rect.height} = ${rect.width * rect.height}${result.ok ? '' : ' ✕'}`)
      .setPosition(Phaser.Math.Clamp(px + w / 2, 70, W - 70), py - 16)
      .setVisible(true)
      .setAlpha(0.95)
  }

  clearPreview() {
    this.previewG?.clear()
    this.previewLabel?.setVisible(false)
  }

  catInside(rect) {
    const cats = this.level.cats.filter(
      (cat) => cat.x >= rect.x && cat.y >= rect.y && cat.x < rect.x + rect.width && cat.y < rect.y + rect.height,
    )
    return cats[0] ?? null
  }

  existingFor(catId) {
    return this.history.state.filter((placement) => placement.catId !== catId)
  }

  attempt(a, b) {
    if (this.locked) return
    const rect = normalizeRect(a, b)
    const cat = this.catInside(rect)
    if (!cat) {
      this.flash('Every rectangle needs one cat inside it.')
      sfx.reject()
      return
    }
    const existing = this.existingFor(cat.id)
    const candidate = { catId: cat.id, x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    const result = validatePlacement(this.level, existing, candidate)
    if (!result.ok) {
      this.flash(result.message)
      sfx.reject()
      this.shake()
      return
    }

    this.history.commit([...existing, candidate])
    this.anchor = null
    sfx.place()
    this.afterChange()
    this.bounceCat(cat.id)
    this.popIn(candidate)
  }

  removeCat(catId) {
    if (this.locked) return
    this.history.commit(this.history.state.filter((placement) => placement.catId !== catId))
    sfx.undo()
    this.anchor = null
    this.afterChange()
  }

  undo() {
    if (this.locked || !this.history.canUndo()) return
    this.history.undo()
    this.anchor = null
    this.previewG.clear()
    sfx.undo()
    this.afterChange()
  }

  redo() {
    if (this.locked || !this.history.canRedo()) return
    this.history.redo()
    this.anchor = null
    this.previewG.clear()
    sfx.place()
    this.afterChange()
  }

  resetBoard() {
    if (this.locked) return
    if (this.history.state.length === 0) return
    this.history.reset([])
    this.resets += 1
    this.anchor = null
    this.hintStage = 0
    this.hintG.clear()
    sfx.undo()
    this.afterChange()
  }

  afterChange({ save = true } = {}) {
    const placements = this.history.state
    this.redrawPlacements()
    this.refreshHud()
    this.drawCursor()
    if (save && this.mode === 'journey' && this.level.id) savePlacements(this.level.id, placements)
    if (!this.locked && isComplete(this.level, placements)) this.finish()
  }

  redrawPlacements() {
    const placements = this.history.state
    this.fillG.clear()
    this.outlineG.clear()
    const cell = this.cell

    placements.forEach((placement) => {
      const index = this.level.cats.findIndex((cat) => cat.id === placement.catId)
      const color = PASTELS[(index < 0 ? 0 : index) % PASTELS.length]
      const x = this.originX + placement.x * cell
      const y = this.originY + placement.y * cell
      const w = placement.width * cell
      const h = placement.height * cell
      this.fillG.fillStyle(color, this.theme.dark ? 0.42 : 0.5)
      this.fillG.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 12)
      this.outlineG.lineStyle(3, color, 0.95)
      this.outlineG.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 12)
    })
  }

  refreshHud() {
    const placements = this.history.state
    const progress = progressOf(this.level, placements)
    const catsPlaced = placements.length
    const tier = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'][this.level.difficulty ?? 1] ?? 'Medium'
    this.statsText.setText(`${tier} · ${catsPlaced}/${this.level.cats.length} cats · ${Math.round(progress.fraction * 100)}%`)
    this.progressText.setText(`${catsPlaced} of ${this.level.cats.length} rectangles · ${progress.covered}/${progress.total} squares`)

    const barX = W / 2 - 210
    const barY = 880
    this.barG.clear()
    this.barG.fillStyle(this.theme.shadow, 0.16)
    this.barG.fillRoundedRect(barX, barY, 420, 10, 5)
    if (progress.fraction > 0) {
      this.barG.fillStyle(this.theme.accent, 0.85)
      this.barG.fillRoundedRect(barX, barY, Math.max(10, 420 * progress.fraction), 10, 5)
    }

    this.controlButtons[0].setAlpha(this.history.canUndo() ? 1 : 0.4)
    this.controlButtons[1].setAlpha(this.history.canRedo() ? 1 : 0.4)
  }

  showHint() {
    if (this.locked) return
    const target = mostConstrainedCat(this.level, this.history.state)
    if (!target) return

    this.hints += 1
    this.hintStage += 1
    const cat = target.cat
    const cx = this.originX + (cat.x + 0.5) * this.cell
    const cy = this.originY + (cat.y + 0.5) * this.cell
    sfx.hint()

    const ring = this.add.circle(cx, cy, this.cell * 0.62, 0x000000, 0)
    ring.setStrokeStyle(4, this.theme.accent, 0.95).setDepth(14)
    this.tweens.add({
      targets: ring,
      scale: 1.45,
      alpha: { from: 1, to: 0 },
      duration: 900,
      repeat: 1,
      onComplete: () => ring.destroy(),
    })

    const solution = this.solution.find((placement) => placement.catId === cat.id)
    if (this.hintStage === 1) {
      this.flash(`Try the ${target.options === 1 ? 'only' : 'tightest'} rectangle: start with this cat.`)
    } else if (this.hintStage === 2 && solution) {
      this.flash(`This cat needs a ${solution.width}×${solution.height} rectangle.`)
    } else if (solution) {
      const existing = this.existingFor(cat.id)
      const candidate = { catId: cat.id, x: solution.x, y: solution.y, width: solution.width, height: solution.height }
      if (validatePlacement(this.level, existing, candidate).ok) {
        this.history.commit([...existing, candidate])
        this.popIn(candidate)
        this.bounceCat(cat.id)
        this.flash('Here is one rectangle — the rest follow from it.')
        this.afterChange()
      } else {
        this.flash('That rectangle no longer fits. Undo a step and try again.')
      }
    }
    this.refreshHud()
  }

  popIn(placement) {
    if (data.settings.reducedMotion) return
    const x = this.originX + placement.x * this.cell
    const y = this.originY + placement.y * this.cell
    const w = placement.width * this.cell
    const h = placement.height * this.cell
    const rect = this.add.rectangle(x + w / 2, y + h / 2, w - 8, h - 8, 0xffffff, 0.5).setDepth(6)
    this.tweens.add({
      targets: rect,
      alpha: 0,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 380,
      onComplete: () => rect.destroy(),
    })
    if (!data.settings.reducedMotion) {
      const spark = this.add.image(x + w / 2, y + h / 2, 'spark').setTint(this.theme.accent).setDepth(9)
      spark.setScale(0.4)
      this.tweens.add({
        targets: spark,
        scale: 1.8,
        alpha: 0,
        duration: 420,
        onComplete: () => spark.destroy(),
      })
    }
  }

  bounceCat(catId) {
    const entry = this.cats.find((item) => item.cat.id === catId)
    if (!entry || data.settings.reducedMotion) return
    this.tweens.add({
      targets: entry.container,
      y: entry.home.y - 12,
      duration: 140,
      yoyo: true,
      ease: 'Quad.Out',
    })
    sfx.cat()
  }

  shake() {
    if (data.settings.reducedMotion) return
    this.cameras.main.shake(90, 0.002)
  }

  flash(message) {
    this.messageText.setText(message).setAlpha(1)
    this.tweens.killTweensOf(this.messageText)
    this.tweens.add({ targets: this.messageText, alpha: 0, delay: 1900, duration: 500 })
  }

  finish() {
    this.locked = true
    this.anchor = null
    this.hintG.clear()
    this.clearPreview()
    sfx.complete()

    const stars = starsFor({ hints: this.hints, resets: this.resets })
    const rects = this.level.cats.length
    const beforeAchievements = [...data.achievements]

    if (!data.settings.reducedMotion) {
      this.cats.forEach((entry, index) => {
        this.tweens.add({
          targets: entry.container,
          y: entry.home.y - 16,
          duration: 220,
          delay: index * 45,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.InOut',
        })
      })
      for (let index = 0; index < 14; index += 1) {
        const spark = this.add
          .image(this.originX + Math.random() * this.pixelW, this.originY + Math.random() * this.pixelH, 'spark')
          .setTint(this.theme.accent)
          .setDepth(15)
        spark.setScale(Phaser.Math.FloatBetween(0.2, 0.6))
        this.tweens.add({
          targets: spark,
          y: spark.y - Phaser.Math.Between(40, 110),
          alpha: 0,
          duration: Phaser.Math.Between(700, 1300),
          delay: index * 40,
          onComplete: () => spark.destroy(),
        })
      }
    }

    record({
      mode: this.mode,
      levelId: this.mode === 'journey' ? this.level.id : '',
      levelNumber: this.levelNumber,
      stars,
      hints: this.hints,
      resets: this.resets,
      rects,
      irregular: isIrregular(this.level),
      difficulty: this.level.difficulty ?? 1,
      date: this.date ?? todayUTC(),
    })

    const unlocked = newlyUnlocked({ achievements: beforeAchievements }, data).map((achievement) => achievement.name)

    this.time.delayedCall(920, () => {
      fade(this, 'complete', {
        mode: this.mode,
        levelId: this.level.id,
        levelNumber: this.levelNumber,
        stars,
        hints: this.hints,
        resets: this.resets,
        rects,
        unlocked,
        nonce: this.payload.nonce ?? 0,
      })
    })
  }

  leave() {
    if (this.mode === 'journey' && this.level.id) savePlacements(this.level.id, this.history.state)
    if (this.mode === 'daily' || this.mode === 'zen') fade(this, 'menu')
    else fade(this, 'menu')
  }
}
