import Phaser from 'phaser'
import { makeTextures, W, H } from './common.js'
import { audioState } from '../sound.js'
import { data } from '../save.js'
import MenuScene from './MenuScene.js'
import LevelsScene from './LevelsScene.js'
import GameScene from './GameScene.js'
import SettingsScene from './SettingsScene.js'
import AchievementsScene from './AchievementsScene.js'
import CompleteScene from './CompleteScene.js'

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    makeTextures(this)
    audioState.muted = !data.settings.sound
    this.scene.start('menu')
  }
}

export function startGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: W,
    height: H,
    backgroundColor: '#fdf8e7',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    scene: [BootScene, MenuScene, LevelsScene, GameScene, CompleteScene, SettingsScene, AchievementsScene],
  })
}
