import Phaser from 'phaser'
import { W, H, background, fade, iconButton, text, themeOf } from './common.js'
import { data } from '../save.js'
import { ACHIEVEMENTS, totalStars } from '../progress.js'

export default class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('achievements')
  }

  create() {
    if (this.input) this.input.enabled = true
    const theme = themeOf(data.settings.theme)
    background(this, theme, { reducedMotion: true })
    this.cameras.main.fadeIn(160, 12, 10, 20)

    iconButton(this, 44, 46, '←', () => fade(this, 'menu'), theme, { size: 48 })
    text(this, W / 2, 44, 'Badges', 26, theme.text, { fontStyle: 'bold' }).setOrigin(0.5)
    text(this, W / 2, 76, `${data.achievements.length}/${ACHIEVEMENTS.length} earned · ${totalStars(data)}★`, 14, theme.subtext).setOrigin(0.5)

    ACHIEVEMENTS.forEach((achievement, index) => {
      const y = 128 + index * 66
      const earned = data.achievements.includes(achievement.id)
      const g = this.add.graphics()
      g.fillStyle(theme.shadow, 0.14)
      g.fillRoundedRect(58, y - 25, W - 116, 54, 14)
      g.fillStyle(theme.panel, earned ? 0.92 : 0.55)
      g.fillRoundedRect(58, y - 29, W - 116, 54, 14)
      g.lineStyle(2, theme.accent, earned ? 0.3 : 0.1)
      g.strokeRoundedRect(58, y - 29, W - 116, 54, 14)

      text(this, 86, y + 2, earned ? '🏅' : '·', 20, theme.subtext).setOrigin(0.5)
      text(this, 118, y - 8, achievement.name, 16, theme.text, { fontStyle: 'bold' }).setOrigin(0, 0.5)
      text(this, 118, y + 12, achievement.description, 12, theme.subtext).setOrigin(0, 0.5)
      if (earned) text(this, W - 82, y - 2, '✓', 20, theme.accent, { fontStyle: 'bold' }).setOrigin(0.5)
    })

    const stats = [
      `${data.levelsCleared} puzzles solved`,
      `${data.totalRects} rectangles`,
      `${data.hintsUsed} hints`,
      `${data.perfects} perfect clears`,
    ]
    text(this, W / 2, H - 92, stats.join('  ·  '), 13, theme.subtext, { align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5)
    text(this, W / 2, H - 48, 'littlejoyarcade.site', 12, theme.subtext, { alpha: 0.65 }).setOrigin(0.5)
  }
}
