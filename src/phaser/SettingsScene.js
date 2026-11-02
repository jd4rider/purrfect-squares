import Phaser from 'phaser'
import { W, H, background, button, fade, iconButton, text, themeOf } from './common.js'
import { data, setSetting, commit } from '../save.js'
import { THEMES, THEME_LIST, unlockedThemes, defaultSave } from '../progress.js'
import { sfx } from '../sound.js'

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('settings')
  }

  create() {
    if (this.input) this.input.enabled = true
    this.confirmingReset = false
    const theme = themeOf(data.settings.theme)
    background(this, theme, { reducedMotion: true })
    this.cameras.main.fadeIn(160, 12, 10, 20)

    iconButton(this, 44, 46, '←', () => fade(this, 'menu'), theme, { size: 48 })
    text(this, W / 2, 44, 'Settings', 26, theme.text, { fontStyle: 'bold' }).setOrigin(0.5)

    const row = (y, label, value, action) => {
      const g = this.add.graphics()
      g.fillStyle(theme.shadow, 0.14)
      g.fillRoundedRect(W / 2 - 260, y - 26, 520, 52, 14)
      g.fillStyle(theme.panel, 0.9)
      g.fillRoundedRect(W / 2 - 260, y - 30, 520, 52, 14)
      text(this, W / 2 - 236, y - 4, label, 17, theme.text, { fontStyle: 'bold' }).setOrigin(0, 0.5)
      button(this, W / 2 + 130, y - 4, value, action, {
        width: 200,
        height: 40,
        size: 14,
        fill: theme.dark ? 0x2b2f52 : 0xffffff,
        textColor: theme.dark ? '#efeaff' : theme.text,
        theme,
      })
    }

    row(126, 'Sound', data.settings.sound ? 'On' : 'Off', () => {
      setSetting('sound', !data.settings.sound)
      this.scene.restart()
    })
    row(192, 'Reduced motion', data.settings.reducedMotion ? 'On' : 'Off', () => {
      setSetting('reducedMotion', !data.settings.reducedMotion)
      this.scene.restart()
    })
    row(258, 'Grid hints', data.settings.showGrid ? 'On' : 'Off', () => {
      setSetting('showGrid', !data.settings.showGrid)
      this.scene.restart()
    })

    text(this, W / 2, 316, 'Theme', 17, theme.text, { fontStyle: 'bold' }).setOrigin(0.5)
    const unlocked = unlockedThemes(data)
    THEME_LIST.forEach((item, index) => {
      const y = 366 + index * 62
      const isUnlocked = unlocked.includes(item.id)
      const active = data.settings.theme === item.id
      const g = this.add.graphics()
      g.fillStyle(theme.shadow, 0.14)
      g.fillRoundedRect(W / 2 - 260, y - 24, 520, 52, 14)
      g.fillStyle(active ? THEMES[item.id].accent : theme.panel, active ? 0.9 : 0.85)
      g.fillRoundedRect(W / 2 - 260, y - 28, 520, 52, 14)
      const labelColor = active ? THEMES[item.id].accentText : theme.text
      text(this, W / 2 - 236, y - 2, item.name, 16, labelColor, { fontStyle: 'bold' }).setOrigin(0, 0.5)
      const status = isUnlocked ? (active ? 'Selected' : 'Use') : `Solve ${item.unlockAt}`
      const chip = text(this, W / 2 + 208, y - 2, status, 13, labelColor, { alpha: 0.85 }).setOrigin(1, 0.5)
      if (isUnlocked && !active) {
        const hit = this.add.zone(W / 2 - 260, y - 28, 520, 52).setOrigin(0).setInteractive({ useHandCursor: true })
        hit.on('pointerdown', () => {
          sfx.click()
          setSetting('theme', item.id)
          this.scene.restart()
        })
      }
      chip.setDepth(2)
    })

    button(this, W / 2, 696, this.confirmingReset ? 'Tap again to erase progress' : 'Reset all progress', () => {
      if (!this.confirmingReset) {
        this.confirmingReset = true
        this.scene.restart()
        return
      }
      commit(defaultSave())
      sfx.undo()
      fade(this, 'menu')
    }, { width: 380, height: 48, size: 14, fill: 0xb4534b, theme })

    text(this, W / 2, 748, 'Progress is saved on this device and in your Little Joy account.', 12, theme.subtext, {
      align: 'center',
      wordWrap: { width: 460 },
      alpha: 0.8,
    }).setOrigin(0.5)
    text(this, W / 2, H - 40, 'v0.1.0 · littlejoyarcade.site', 12, theme.subtext, { alpha: 0.7 }).setOrigin(0.5)
  }
}
