// Shared presentation: palettes, generated textures, wooden UI, and the cats
// themselves. No image or font files ship with the game; everything is drawn.

import Phaser from 'phaser'

export const W = 640
export const H = 940
export const FONT = 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export const THEMES = {
  garden: {
    id: 'garden',
    name: 'Sunny Garden',
    bg: ['#fdf8e7', '#dff0c8'],
    accent: 0x4f9d69,
    accentText: '#ffffff',
    text: '#3d2c1d',
    subtext: '#7c6249',
    panel: 0xffffff,
    panelAlpha: 0.82,
    shadow: 0x6b5138,
    wood: 0xd0a273,
    woodDark: 0xa97a4e,
    woodEdge: 0x8a5f39,
    tile: 0xfdf1da,
    tileEdge: 0xd9bd94,
    tileShadow: 0x8c6a45,
    recess: 0x8d6a45,
    dark: false,
    sky: 0xfff4c9,
  },
  cottage: {
    id: 'cottage',
    name: 'Cozy Cottage',
    bg: ['#f8ece0', '#e6cdbc'],
    accent: 0xb4534b,
    accentText: '#fff5ef',
    text: '#3a2a22',
    subtext: '#7d5b4b',
    panel: 0xfff7f0,
    panelAlpha: 0.86,
    shadow: 0x6a4a3a,
    wood: 0xc08a62,
    woodDark: 0x9c6a45,
    woodEdge: 0x7c5134,
    tile: 0xfff4e5,
    tileEdge: 0xdcc0a2,
    tileShadow: 0x8a6647,
    recess: 0x8f6a4a,
    dark: false,
    sky: 0xfbe7d2,
  },
  moonlight: {
    id: 'moonlight',
    name: 'Moonlight Cats',
    bg: ['#131a33', '#2b2350'],
    accent: 0x8b9cf9,
    accentText: '#131a33',
    text: '#ecebff',
    subtext: '#a9b1e0',
    panel: 0x1d2140,
    panelAlpha: 0.88,
    shadow: 0x05060f,
    wood: 0x555a8c,
    woodDark: 0x3c3f6b,
    woodEdge: 0x2a2c50,
    tile: 0x3a3866,
    tileEdge: 0x555185,
    tileShadow: 0x181630,
    recess: 0x14122a,
    dark: true,
    sky: 0x27305c,
  },
  candy: {
    id: 'candy',
    name: 'Candy Cats',
    bg: ['#fff2f8', '#e6e0ff'],
    accent: 0xd9468f,
    accentText: '#ffffff',
    text: '#4a2140',
    subtext: '#9a5a86',
    panel: 0xfff8fc,
    panelAlpha: 0.86,
    shadow: 0x7a3a60,
    wood: 0xf0aac6,
    woodDark: 0xd98cae,
    woodEdge: 0xbc6f92,
    tile: 0xfff7fc,
    tileEdge: 0xefc9dd,
    tileShadow: 0xa86687,
    recess: 0xb3748f,
    dark: false,
    sky: 0xffe3f1,
  },
  palace: {
    id: 'palace',
    name: 'Royal Cat Palace',
    bg: ['#fdf5dd', '#eddcb0'],
    accent: 0x8a5a00,
    accentText: '#fff6dc',
    text: '#3b2a10',
    subtext: '#7b6234',
    panel: 0xfff9e8,
    panelAlpha: 0.88,
    shadow: 0x5a4213,
    wood: 0xb98a3c,
    woodDark: 0x8f6524,
    woodEdge: 0x6d4b16,
    tile: 0xfff8e4,
    tileEdge: 0xe0c795,
    tileShadow: 0x8a6524,
    recess: 0x7d5a20,
    dark: false,
    sky: 0xfbecc0,
  },
}

export const THEME_LIST = Object.values(THEMES)

export function themeOf(id) {
  return THEMES[id] ?? THEMES.garden
}

export const COATS = {
  ginger: { fur: 0xf0a76b, ear: 0xdd8a4d, patch: 0xf7c79a, eye: 0x3a2a1d },
  grey: { fur: 0xb8bcc9, ear: 0x9ba0b1, patch: 0xd6d9e2, eye: 0x33384a },
  black: { fur: 0x4d4c5c, ear: 0x3a3947, patch: 0x6b6a7d, eye: 0xf5f2e6 },
  cream: { fur: 0xf3ddb8, ear: 0xe2c79c, patch: 0xfbeeda, eye: 0x5a4632 },
  calico: { fur: 0xf2dcc0, ear: 0xe0b98f, patch: 0xd98b5f, eye: 0x4a3323 },
  tuxedo: { fur: 0x5a5d72, ear: 0x46485c, patch: 0xf6f1e4, eye: 0xf8f4e6 },
  blue: { fur: 0x92a9d6, ear: 0x7a92c2, patch: 0xbccbe8, eye: 0x2f3d55 },
}

const canvasCache = new Set()

function canvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return
  const texture = scene.textures.createCanvas(key, width, height)
  draw(texture.getContext(), width, height)
  texture.refresh()
}

export function makeTextures(scene) {
  canvasTexture(scene, 'spark', 16, 16, (ctx) => {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(8, 8, 8, 0, Math.PI * 2)
    ctx.fill()
  })
  canvasTexture(scene, 'glow', 64, 64, (ctx) => {
    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.15)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
  })
}

/** Soft themed backdrop with a sun/moon and a few drifting leaves. */
export function background(scene, theme, { reducedMotion = false } = {}) {
  const key = `bg-${theme.id}`
  if (!canvasCache.has(key)) {
    canvasTexture(scene, key, 9, H, (ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, H)
      gradient.addColorStop(0, theme.bg[0])
      gradient.addColorStop(1, theme.bg[1])
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 9, H)
    })
    canvasCache.add(key)
  }
  scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setDepth(-100)

  const orb = scene.add.circle(theme.dark ? W - 96 : 96, 96, theme.dark ? 42 : 54, theme.dark ? 0xf4f1ff : theme.sky, theme.dark ? 0.9 : 0.55)
  orb.setDepth(-95)
  if (theme.dark) {
    scene.add.circle(W - 78, 82, 38, Phaser.Display.Color.HexStringToColor(theme.bg[0]).color, 1).setDepth(-94)
  }

  if (!reducedMotion) {
    for (let index = 0; index < 7; index += 1) {
      const leaf = scene.add.ellipse(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(80, H - 80),
        9,
        5,
        theme.dark ? 0x8b9cf9 : 0x8bc48f,
        theme.dark ? 0.16 : 0.22,
      )
      leaf.setRotation(Math.random() * Math.PI)
      leaf.setDepth(-90)
      scene.tweens.add({
        targets: leaf,
        y: leaf.y - Phaser.Math.Between(30, 70),
        x: leaf.x + Phaser.Math.Between(-40, 40),
        rotation: leaf.rotation + Math.PI,
        duration: Phaser.Math.Between(9000, 16000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      })
    }
  }
  return orb
}

export function text(scene, x, y, value, size = 22, color = '#fff', extra = {}) {
  return scene.add.text(x, y, value, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    ...extra,
  })
}

export function panel(scene, x, y, width, height, theme, { radius = 24, alpha = theme.panelAlpha, depth } = {}) {
  const g = scene.add.graphics()
  g.fillStyle(theme.shadow, theme.dark ? 0.55 : 0.18)
  g.fillRoundedRect(x - width / 2 + 5, y - height / 2 + 9, width, height, radius)
  g.fillStyle(theme.panel, alpha)
  g.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius)
  g.lineStyle(2, theme.accent, 0.18)
  g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius)
  if (depth !== undefined) g.setDepth(depth)
  return g
}

export function button(scene, x, y, caption, onClick, options = {}) {
  const {
    width = 200,
    height = 56,
    size = 19,
    fill,
    textColor,
    radius = 18,
    theme = THEMES.garden,
    icon = '',
    depth,
  } = options

  const bgFill = fill ?? theme.accent
  const labelColor = textColor ?? theme.accentText
  const box = scene.add.container(x, y)
  const bg = scene.add.graphics()

  const draw = (alphaValue, lift = 0) => {
    bg.clear()
    bg.fillStyle(theme.shadow, 0.22)
    bg.fillRoundedRect(-width / 2, -height / 2 + lift + 5, width, height, radius)
    bg.fillStyle(bgFill, alphaValue)
    bg.fillRoundedRect(-width / 2, -height / 2 + lift, width, height, radius)
    bg.lineStyle(2, 0xffffff, 0.22)
    bg.strokeRoundedRect(-width / 2, -height / 2 + lift, width, height, radius)
  }
  draw(1)

  const label = text(scene, 0, 0, `${icon ? `${icon}  ` : ''}${caption}`, size, labelColor, {
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5)

  box.add([bg, label])
  box.setSize(width, height).setInteractive({ useHandCursor: true })
  box.on('pointerover', () => draw(1, -2))
  box.on('pointerout', () => draw(1, 0))
  box.on('pointerdown', () => {
    scene.tweens.add({ targets: box, scale: 0.96, duration: 70, yoyo: true })
    onClick()
  })
  if (depth !== undefined) box.setDepth(depth)
  box.setCaption = (value) => label.setText(value)
  box.setEnabled = (enabled) => {
    box.setAlpha(enabled ? 1 : 0.42)
    box.disableInteractive()
    if (enabled) box.setInteractive({ useHandCursor: true })
  }
  return box
}

export function iconButton(scene, x, y, glyph, onClick, theme, { size = 54, depth } = {}) {
  const box = scene.add.container(x, y)
  const bg = scene.add.graphics()
  bg.fillStyle(theme.dark ? 0xffffff : theme.accent, 0.14)
  bg.fillCircle(0, 0, size / 2)
  bg.lineStyle(2, theme.accent, 0.3)
  bg.strokeCircle(0, 0, size / 2)
  const label = text(scene, 0, 0, glyph, size * 0.44, theme.text).setOrigin(0.5)
  box.add([bg, label])
  box.setSize(size, size).setInteractive({ useHandCursor: true })
  box.on('pointerover', () => box.setScale(1.08))
  box.on('pointerout', () => box.setScale(1))
  box.on('pointerdown', onClick)
  if (depth !== undefined) box.setDepth(depth)
  return box
}

export function fade(scene, target, payload) {
  if (scene.input) scene.input.enabled = false
  scene.cameras.main.fadeOut(160, 8, 8, 20)
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(target, payload))
}

export function starString(stars, max = 3) {
  return '★'.repeat(Math.max(0, stars)) + '☆'.repeat(Math.max(0, max - stars))
}

/**
 * A raised cat figurine: shadow, ears, head, face and a number badge. The eye
 * group is returned in container data so a scene can blink it.
 */
export function drawCat(scene, x, y, size, cat, theme, { showNumber = true, scale = 1 } = {}) {
  const coat = COATS[cat.coat] ?? COATS.ginger
  const container = scene.add.container(x, y)
  const r = size * 0.34

  const shadow = scene.add.ellipse(0, r * 1.28, r * 2.05, r * 0.62, theme.shadow, theme.dark ? 0.5 : 0.24)
  const body = scene.add.ellipse(0, r * 0.68, r * 1.62, r * 1.15, coat.fur, 1)
  const head = scene.add.circle(0, 0, r, coat.fur, 1)
  const patch = scene.add.ellipse(-r * 0.38, -r * 0.22, r * 0.62, r * 0.5, coat.patch, 0.55)

  const earShape = (side) => {
    const ear = scene.add.triangle(side * r * 0.62, -r * 0.86, -r * 0.34, r * 0.36, r * 0.34, r * 0.36, 0, -r * 0.3, coat.fur, 1)
    const inner = scene.add.triangle(
      side * r * 0.62,
      -r * 0.8,
      -r * 0.18,
      r * 0.24,
      r * 0.18,
      r * 0.24,
      0,
      -r * 0.16,
      0xffb7bd,
      0.8,
    )
    return [ear, inner]
  }

  const eyes = scene.add.container(0, -r * 0.06)
  const eyeL = scene.add.ellipse(-r * 0.34, 0, r * 0.2, r * 0.28, coat.eye, 1)
  const eyeR = scene.add.ellipse(r * 0.34, 0, r * 0.2, r * 0.28, coat.eye, 1)
  const glintL = scene.add.circle(-r * 0.3, -r * 0.06, r * 0.07, 0xffffff, 0.9)
  const glintR = scene.add.circle(r * 0.38, -r * 0.06, r * 0.07, 0xffffff, 0.9)
  eyes.add([eyeL, eyeR, glintL, glintR])

  const nose = scene.add.triangle(0, r * 0.24, -r * 0.1, 0, r * 0.1, 0, 0, r * 0.12, 0xf0859b, 1)

  const whiskers = scene.add.graphics()
  whiskers.lineStyle(Math.max(1.2, r * 0.045), 0xffffff, 0.5)
  for (const side of [-1, 1]) {
    for (let index = 0; index < 2; index += 1) {
      const y0 = r * (0.18 + index * 0.16)
      whiskers.lineBetween(side * r * 0.42, y0, side * r * 1.08, y0 - r * 0.08 + index * r * 0.18)
    }
  }

  container.add([shadow, body, ...earShape(-1), ...earShape(1), head, patch, eyes, nose, whiskers])

  if (showNumber) {
    const badgeR = Math.max(11, r * 0.52)
    const badge = scene.add.circle(r * 0.82, r * 0.78, badgeR, theme.dark ? 0xf4f1ff : 0xfffdf6, 1)
    badge.setStrokeStyle(2, theme.dark ? 0x131a33 : 0x6b4a2a, 0.35)
    const label = text(scene, r * 0.82, r * 0.78, String(cat.area), Math.max(12, Math.round(badgeR * 1.05)), theme.dark ? '#131a33' : '#4a2f18', {
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add([badge, label])
  }

  container.setSize(size, size)
  container.setScale(scale)
  container.setData('eyes', eyes)
  container.setData('head', head)
  return container
}

/** A tiny idle bounce, used on menus and on completion. */
export function catIdle(scene, catContainer, reducedMotion = false) {
  if (reducedMotion) return
  scene.tweens.add({
    targets: catContainer.getData('head'),
    y: -3,
    duration: 1500 + Math.random() * 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  })
}

/** Blink on a loop; cheap and it makes a board full of cats feel alive. */
export function catBlink(scene, catContainer, reducedMotion = false) {
  if (reducedMotion) return
  const eyes = catContainer.getData('eyes')
  if (!eyes) return
  const schedule = () => {
    scene.time.delayedCall(2400 + Math.random() * 4200, () => {
      if (!eyes.active) return
      scene.tweens.add({
        targets: eyes,
        scaleY: 0.12,
        duration: 90,
        yoyo: true,
        ease: 'Quad.Out',
        onComplete: schedule,
      })
    })
  }
  schedule()
}
