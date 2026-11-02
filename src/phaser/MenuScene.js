import Phaser from 'phaser'
import { W, H, background, button, catBlink, drawCat, fade, starString, text, themeOf } from './common.js'
import { data, setSetting } from '../save.js'
import { levelAt, levelNumber, todayUTC, TOTAL_LEVELS, chapterOf } from '../levels/index.js'
import { THEME_LIST, totalStars } from '../progress.js'
import { sfx } from '../sound.js'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu')
  }

  create() {
    if (this.input) this.input.enabled = true
    const theme = themeOf(data.settings.theme)
    background(this, theme, { reducedMotion: data.settings.reducedMotion })
    this.cameras.main.fadeIn(200, 12, 10, 20)

    // A tiny tray of cats as the wordmark's companion piece.
    const tray = this.add.container(W / 2, 178)
    const g = this.add.graphics()
    g.fillStyle(theme.shadow, 0.22)
    g.fillRoundedRect(-146, -92, 300, 196, 26)
    g.fillStyle(theme.woodEdge, 1)
    g.fillRoundedRect(-150, -98, 300, 196, 26)
    g.fillStyle(theme.wood, 1)
    g.fillRoundedRect(-150, -102, 300, 196, 26)
    g.fillStyle(theme.recess, 0.45)
    g.fillRoundedRect(-134, -86, 268, 164, 18)
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        g.fillStyle(theme.tile, 1)
        g.fillRoundedRect(-130 + col * 66, -82 + row * 62, 60, 56, 10)
        g.lineStyle(2, theme.tileEdge, 0.9)
        g.strokeRoundedRect(-130 + col * 66, -82 + row * 62, 60, 56, 10)
      }
    }
    tray.add(g)

    const catA = drawCat(this, -64, -40, 54, { area: 4, coat: 'ginger' }, theme, { scale: 0.92 })
    const catB = drawCat(this, 62, 22, 54, { area: 6, coat: 'blue' }, theme, { scale: 0.92 })
    tray.add([catA, catB])
    catBlink(this, catA, data.settings.reducedMotion)
    catBlink(this, catB, data.settings.reducedMotion)
    this.tweens.add({ targets: tray, y: tray.y - 5, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    text(this, W / 2, 288, 'PURRFECT', 46, theme.text, {
      fontStyle: 'bold',
      stroke: theme.dark ? '#0b1020' : '#fffdf6',
      strokeThickness: 8,
    }).setOrigin(0.5)
    text(this, W / 2, 336, 'SQUARES', 46, theme.accent, {
      fontStyle: 'bold',
      stroke: theme.dark ? '#0b1020' : '#fffdf6',
      strokeThickness: 8,
    }).setOrigin(0.5)
    text(this, W / 2, 384, 'Cozy cat rectangles. No timer, no rush.', 17, theme.subtext, {
      align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5)

    const nextNumber = Math.min(data.unlocked, TOTAL_LEVELS)
    const nextLevel = levelAt(nextNumber)
    const chapter = chapterOf(nextLevel)
    button(this, W / 2, 452, `${nextNumber > 1 ? 'Continue' : 'Play'} · ${chapter.name} ${nextNumber}`, () => {
      fade(this, 'game', { mode: 'journey', level: nextNumber })
    }, { width: 470, height: 62, size: 20, theme, icon: '🐾' })

    const pair = (y, left, right) => {
      for (const [index, item] of [left, right].entries()) {
        button(this, W / 2 + (index === 0 ? -108 : 108), y, item.label, item.action, {
          width: 204,
          height: 54,
          size: 16,
          fill: theme.dark ? 0x2b2f52 : 0xffffff,
          textColor: theme.dark ? '#efeaff' : theme.text,
          theme,
          icon: item.icon,
        })
      }
    }

    pair(534, { label: 'Journey', icon: '🗺', action: () => fade(this, 'levels') }, { label: 'Daily', icon: '📅', action: () => fade(this, 'game', { mode: 'daily' }) })
    pair(600, { label: 'Zen', icon: '🌿', action: () => fade(this, 'game', { mode: 'zen' }) }, { label: 'Unlimited', icon: '∞', action: () => fade(this, 'game', { mode: 'unlimited' }) })
    pair(666, { label: 'Expert', icon: '🎩', action: () => fade(this, 'game', { mode: 'expert' }) }, { label: 'Badges', icon: '🏅', action: () => fade(this, 'achievements') })

    button(this, W / 2, 724, 'Settings', () => fade(this, 'settings'), {
      width: 204,
      height: 48,
      size: 15,
      fill: theme.dark ? 0x2b2f52 : 0xffffff,
      textColor: theme.dark ? '#efeaff' : theme.text,
      theme,
      icon: '⚙',
    })

    const today = todayUTC()
    const dailyStars = data.daily[today]?.stars ?? 0
    text(this, W / 2, 776, dailyStars ? `Today's catnap: ${starString(dailyStars)}` : "Today's catnap is waiting.", 14, theme.subtext, {
      alpha: 0.9,
    }).setOrigin(0.5)
    text(this, W / 2, 802, `${Object.keys(data.stars).length} of ${TOTAL_LEVELS} solved · ${totalStars(data)}★`, 14, theme.subtext, {
      alpha: 0.9,
    }).setOrigin(0.5)

    button(this, 108, 856, data.settings.sound ? 'Sound on' : 'Muted', () => {
      setSetting('sound', !data.settings.sound)
      this.scene.restart()
    }, { width: 168, height: 42, size: 13, fill: theme.dark ? 0x2b2f52 : 0xffffff, textColor: theme.dark ? '#efeaff' : theme.text, theme })

    const themeName = THEME_LIST.find((item) => item.id === data.settings.theme)?.name ?? 'Sunny Garden'
    button(this, W - 108, 856, themeName, () => {
      const unlocked = THEME_LIST.filter((item) => data.levelsCleared >= item.unlockAt)
      const index = unlocked.findIndex((item) => item.id === data.settings.theme)
      setSetting('theme', unlocked[(index + 1) % unlocked.length].id)
      this.scene.restart()
    }, { width: 168, height: 42, size: 13, fill: theme.dark ? 0x2b2f52 : 0xffffff, textColor: theme.dark ? '#efeaff' : theme.text, theme })

    const arcade = text(this, W / 2, 904, 'littlejoyarcade.site →', 14, theme.subtext, { fontStyle: 'bold' }).setOrigin(0.5)
    arcade.setInteractive({ useHandCursor: true })
    arcade.on('pointerdown', () => {
      sfx.click()
      window.open('https://littlejoyarcade.site', '_blank', 'noopener')
    })

    this.input.keyboard?.on('keydown-ENTER', () => fade(this, 'game', { mode: 'journey', level: nextNumber }))
  }
}
