import Phaser from 'phaser'
import { openTipJar } from './support.js'
import { W, H, background, button, drawCat, starString, text, themeOf, catIdle, fade } from './common.js'
import { data } from '../save.js'
import { levelAt } from '../levels/index.js'

export default class CompleteScene extends Phaser.Scene {
  constructor() {
    super('complete')
  }

  init(payload) {
    this.result = payload ?? {}
  }

  create() {
    const theme = themeOf(data.settings.theme)
    const result = this.result
    background(this, theme, { reducedMotion: data.settings.reducedMotion, motes: false })
    this.cameras.main.fadeIn(180, 12, 10, 20)

    const panel = this.add.container(W / 2, H / 2)
    const g = this.add.graphics()
    g.fillStyle(theme.shadow, 0.25)
    g.fillRoundedRect(-260, -300, 520, 610, 30)
    g.fillStyle(theme.panel, 0.96)
    g.fillRoundedRect(-260, -306, 520, 610, 30)
    g.lineStyle(3, theme.accent, 0.25)
    g.strokeRoundedRect(-260, -306, 520, 610, 30)
    panel.add(g)

    if (!data.settings.reducedMotion) {
      for (let index = 0; index < 18; index += 1) {
        const spark = this.add.image(W / 2 + Phaser.Math.Between(-220, 220), H / 2 + Phaser.Math.Between(-280, 120), 'spark')
        spark.setScale(Phaser.Math.FloatBetween(0.15, 0.5)).setAlpha(0)
        spark.setTint(theme.accent)
        this.tweens.add({
          targets: spark,
          alpha: { from: 0, to: 0.85 },
          y: spark.y - Phaser.Math.Between(30, 90),
          duration: Phaser.Math.Between(1200, 2200),
          delay: index * 90,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        })
      }
    }

    const title = result.mode === 'daily' ? 'Daily catnap complete' : result.mode === 'journey' ? 'Purrfect!' : 'Solved!'
    const titleText = text(this, 0, -238, title, 34, theme.text, { fontStyle: 'bold' }).setOrigin(0.5)
    panel.add(titleText)

    const starsLine = starString(result.stars ?? 0)
    const starText = text(this, 0, -184, starsLine, 44, '#e8a93b', { fontStyle: 'bold' }).setOrigin(0.5)
    panel.add(starText)

    const cat = drawCat(this, 0, -96, 96, { area: result.rects ?? 4, coat: 'ginger' }, theme, { scale: 1 })
    panel.add(cat)
    catIdle(this, cat, data.settings.reducedMotion)
    this.tweens.add({ targets: cat, scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    const lines = [
      `${result.rects ?? 0} rectangles placed`,
      result.hints ? `${result.hints} hint${result.hints === 1 ? '' : 's'} used` : 'No hints needed',
      result.levelNumber ? `Journey ${result.levelNumber}/200` : 'A fresh board every day',
    ]
    lines.forEach((line, index) => {
      const item = text(this, 0, -8 + index * 26, line, 15, theme.subtext).setOrigin(0.5)
      panel.add(item)
    })

    if (result.unlocked?.length > 0) {
      const badge = text(this, 0, 84, `🏅 ${result.unlocked.join(' · ')}`, 14, theme.accent, {
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 420 },
      }).setOrigin(0.5)
      panel.add(badge)
    }

    const nextNumber = result.levelNumber ? Math.min(200, result.levelNumber + 1) : 0
    const primaryLabel = result.mode === 'journey' && nextNumber ? `Next · ${levelAt(nextNumber).name}` : 'Play again'
    const primaryAction = () => {
      if (result.mode === 'journey' && nextNumber) {
        fade(this, 'game', { mode: 'journey', level: nextNumber })
      } else if (result.mode === 'daily') {
        fade(this, 'menu')
      } else {
        fade(this, 'game', { mode: result.mode, level: result.levelNumber, nonce: (result.nonce ?? 0) + 1 })
      }
    }

    const primary = button(this, 0, 156, primaryLabel, primaryAction, { width: 400, height: 56, size: 17, theme, icon: '▶' })
    panel.add(primary)

    const replay = button(this, -102, 226, 'Replay', () => {
      fade(this, 'game', { mode: result.mode, level: result.levelNumber, nonce: result.nonce ?? 0 })
    }, { width: 190, height: 48, size: 14, fill: theme.dark ? 0x2b2f52 : 0xffffff, textColor: theme.dark ? '#efeaff' : theme.text, theme })
    const menu = button(this, 102, 226, 'Menu', () => fade(this, 'menu'), {
      width: 190,
      height: 48,
      size: 14,
      fill: theme.dark ? 0x2b2f52 : 0xffffff,
      textColor: theme.dark ? '#efeaff' : theme.text,
      theme,
    })
    panel.add([replay, menu])

    // Quiet support link: results screen only, inside the card under the actions.
    panel.add(
      button(this, 0, 276, '☕ Buy me a coffee', () => openTipJar(), {
        width: 380,
        height: 28,
        size: 12,
        theme,
        fill: theme.dark ? 0x2b2f52 : 0xffffff,
        textColor: theme.dark ? '#efeaff' : theme.text,
      }),
    )

    text(this, W / 2, H - 34, 'littlejoyarcade.site', 13, theme.subtext, { alpha: 0.7 }).setOrigin(0.5)
  }
}
