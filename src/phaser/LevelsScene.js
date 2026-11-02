import Phaser from 'phaser'
import { W, H, background, button, fade, iconButton, starString, text, themeOf } from './common.js'
import { data } from '../save.js'
import { CHAPTERS, levelNumber, TOTAL_LEVELS } from '../levels/index.js'
import { isUnlocked } from '../progress.js'
import { sfx } from '../sound.js'

export default class LevelsScene extends Phaser.Scene {
  constructor() {
    super('levels')
  }

  init(payload) {
    this.chapterIndex = payload?.chapter ?? Math.max(0, Math.floor((data.unlocked - 1) / 25))
  }

  create() {
    if (this.input) this.input.enabled = true
    const theme = themeOf(data.settings.theme)
    background(this, theme, { reducedMotion: data.settings.reducedMotion })
    this.cameras.main.fadeIn(180, 12, 10, 20)

    iconButton(this, 44, 46, '←', () => fade(this, 'menu'), theme, { size: 48 })
    text(this, W / 2, 40, 'Journey', 26, theme.text, { fontStyle: 'bold' }).setOrigin(0.5)
    text(this, W / 2, 68, `${Object.keys(data.stars).length} of ${TOTAL_LEVELS} solved`, 14, theme.subtext).setOrigin(0.5)

    const chapter = CHAPTERS[Math.min(CHAPTERS.length - 1, this.chapterIndex)]
    const tabWidth = 140
    const tabHeight = 40
    CHAPTERS.forEach((item, index) => {
      const col = index % 4
      const row = Math.floor(index / 4)
      const x = W / 2 + (col - 1.5) * (tabWidth + 6)
      const y = 108 + row * (tabHeight + 6)
      const active = index === this.chapterIndex
      const locked = item.levels[0] ? !isUnlocked(data, levelNumber(item.levels[0])) : false
      button(this, x, y, `${item.number}`, () => {
        sfx.click()
        this.chapterIndex = index
        this.scene.restart({ chapter: index })
      }, {
        width: tabWidth,
        height: tabHeight,
        size: 15,
        fill: active ? theme.accent : theme.dark ? 0x2b2f52 : 0xffffff,
        textColor: active ? theme.accentText : theme.dark ? '#efeaff' : theme.text,
        theme,
        radius: 12,
      }).setAlpha(locked ? 0.45 : 1)
    })

    text(this, W / 2, 214, `${chapter.name}`, 20, theme.text, { fontStyle: 'bold' }).setOrigin(0.5)
    const chapterSolved = chapter.levels.filter((level) => data.stars[level.id]).length
    text(this, W / 2, 240, `${chapterSolved}/${chapter.levels.length} in this chapter`, 13, theme.subtext).setOrigin(0.5)

    const columns = 5
    const tileW = 92
    const tileH = 74
    const gapX = 14
    const gapY = 12
    const startX = W / 2 - ((columns - 1) * (tileW + gapX)) / 2
    const startY = 300

    chapter.levels.forEach((level, index) => {
      const number = levelNumber(level)
      const col = index % columns
      const row = Math.floor(index / columns)
      const x = startX + col * (tileW + gapX)
      const y = startY + row * (tileH + gapY)
      const unlocked = isUnlocked(data, number)
      const stars = data.stars[level.id] ?? 0

      const box = this.add.container(x, y)
      const g = this.add.graphics()
      const draw = (hover = false) => {
        g.clear()
        g.fillStyle(theme.shadow, 0.18)
        g.fillRoundedRect(-tileW / 2, -tileH / 2 + 4, tileW, tileH, 14)
        g.fillStyle(unlocked ? (hover ? theme.accent : theme.dark ? 0x32375e : 0xffffff) : theme.dark ? 0x24284a : 0xf1e6d6, 1)
        g.fillRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH, 14)
        g.lineStyle(2, theme.accent, unlocked ? 0.28 : 0.12)
        g.strokeRoundedRect(-tileW / 2, -tileH / 2, tileW, tileH, 14)
      }
      draw()

      const label = text(this, 0, -10, unlocked ? String(number) : '🔒', 22, unlocked ? (theme.dark ? '#efeaff' : theme.text) : theme.subtext, {
        fontStyle: 'bold',
      }).setOrigin(0.5)
      const starText = text(this, 0, 20, unlocked ? starString(stars) : chapter.name, 13, unlocked ? theme.accent : theme.subtext, {
        fontSize: unlocked ? '14px' : '10px',
      }).setOrigin(0.5)

      box.add([g, label, starText])
      if (unlocked) {
        box.setSize(tileW, tileH).setInteractive({ useHandCursor: true })
        box.on('pointerover', () => draw(true))
        box.on('pointerout', () => draw(false))
        box.on('pointerdown', () => {
          sfx.click()
          fade(this, 'game', { mode: 'journey', level: number })
        })
      } else {
        box.setAlpha(0.55)
      }
    })

    const firstLocked = chapter.levels.find((level) => !isUnlocked(data, levelNumber(level)))
    button(this, W / 2, H - 64, firstLocked ? 'Next unsolved' : 'Replay chapter start', () => {
      const target = firstLocked ? levelNumber(firstLocked) : levelNumber(chapter.levels[0])
      fade(this, 'game', { mode: 'journey', level: target })
    }, { width: 380, height: 46, size: 15, theme })
  }
}
