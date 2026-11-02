// Progression rules: stars, unlocks, achievements. No rendering, no storage.
// The arcade client mirrors this save, so everything here stays plain JSON.

export const SAVE_VERSION = 1
export const MAX_STARS = 3
export const TOTAL_LEVELS = 200

export const THEMES = [
  { id: 'garden', name: 'Sunny Garden', unlockAt: 0 },
  { id: 'cottage', name: 'Cozy Cottage', unlockAt: 8 },
  { id: 'moonlight', name: 'Moonlight Cats', unlockAt: 20 },
  { id: 'candy', name: 'Candy Cats', unlockAt: 40 },
  { id: 'palace', name: 'Royal Cat Palace', unlockAt: 75 },
]

export const THEME_LIST = THEMES

export const ACHIEVEMENTS = [
  { id: 'first_purr', name: 'First Purr', description: 'Finish your first puzzle.', check: (s) => s.levelsCleared >= 1 },
  { id: 'ten_happy_cats', name: 'Ten Happy Cats', description: 'Place ten complete rectangles.', check: (s) => s.totalRects >= 10 },
  { id: 'rectangle_rookie', name: 'Rectangle Rookie', description: 'Finish ten puzzles.', check: (s) => s.levelsCleared >= 10 },
  { id: 'garden_genius', name: 'Garden Genius', description: 'Finish twenty-five puzzles.', check: (s) => s.levelsCleared >= 25 },
  { id: 'no_hints_needed', name: 'No Hints Needed', description: 'Finish five puzzles without a hint.', check: (s) => s.perfects >= 5 },
  { id: 'daily_catnap', name: 'Daily Catnap', description: 'Finish a daily puzzle.', check: (s) => Object.keys(s.daily).length >= 1 },
  { id: 'daily_week', name: 'Seven Cozy Days', description: 'Keep a seven-day daily streak.', check: (s) => s.streak.count >= 7 },
  { id: 'master_of_shapes', name: 'Master of Shapes', description: 'Finish a puzzle on an irregular board.', check: (s) => s.irregularClears >= 1 },
  { id: 'hundred_puzzles', name: '100 Puzzles Solved', description: 'Finish one hundred puzzles.', check: (s) => s.levelsCleared >= 100 },
  { id: 'purrfect_master', name: 'Purrfect Master', description: 'Finish every Journey puzzle.', check: (s) => s.completedJourney },
]

export function defaultSave() {
  return {
    version: SAVE_VERSION,
    unlocked: 1,
    stars: {},
    placements: {},
    daily: {},
    achievements: [],
    levelsCleared: 0,
    perfects: 0,
    totalRects: 0,
    hintsUsed: 0,
    irregularClears: 0,
    expertClears: 0,
    streak: { last: null, count: 0 },
    settings: { sound: true, reducedMotion: false, theme: 'garden', showGrid: true },
    completedJourney: false,
    updatedAt: 0,
  }
}

const asInt = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : fallback)
const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

export function normalizeSave(raw) {
  const base = defaultSave()
  if (!raw || typeof raw !== 'object') return base

  const stars = {}
  if (raw.stars && typeof raw.stars === 'object') {
    for (const [key, value] of Object.entries(raw.stars)) {
      const star = Math.min(MAX_STARS, asInt(value))
      if (star > 0 && /^j\d{3}$/.test(key)) stars[key] = star
    }
  }

  const placements = {}
  if (raw.placements && typeof raw.placements === 'object') {
    for (const [key, value] of Object.entries(raw.placements)) {
      if (!/^j\d{3}$/.test(key) || !Array.isArray(value)) continue
      const clean = value
        .filter((item) => item && typeof item.catId === 'string' && Number.isInteger(item.x) && Number.isInteger(item.y))
        .filter((item) => Number.isInteger(item.width) && Number.isInteger(item.height))
        .filter((item) => item.width > 0 && item.height > 0 && item.width <= 12 && item.height <= 12)
        .map(({ catId, x, y, width, height }) => ({ catId, x, y, width, height }))
      if (clean.length > 0) placements[key] = clean.slice(0, 30)
    }
  }

  const daily = {}
  if (raw.daily && typeof raw.daily === 'object') {
    for (const [date, entry] of Object.entries(raw.daily)) {
      if (!isDate(date)) continue
      daily[date] = { stars: Math.min(MAX_STARS, Math.max(1, asInt(entry?.stars, 1))) }
    }
  }

  const theme = THEMES.some((item) => item.id === raw.settings?.theme) ? raw.settings.theme : base.settings.theme
  const cleared = asInt(raw.levelsCleared)

  return {
    ...base,
    version: SAVE_VERSION,
    unlocked: Math.min(TOTAL_LEVELS, Math.max(1, asInt(raw.unlocked, 1))),
    stars,
    placements,
    daily,
    achievements: Array.isArray(raw.achievements) ? raw.achievements.filter((id) => typeof id === 'string') : [],
    levelsCleared: cleared,
    perfects: asInt(raw.perfects),
    totalRects: asInt(raw.totalRects),
    hintsUsed: asInt(raw.hintsUsed),
    irregularClears: asInt(raw.irregularClears),
    expertClears: asInt(raw.expertClears),
    streak: {
      last: isDate(raw.streak?.last) ? raw.streak.last : null,
      count: asInt(raw.streak?.count),
    },
    settings: {
      sound: raw.settings?.sound !== false,
      reducedMotion: raw.settings?.reducedMotion === true,
      theme,
      showGrid: raw.settings?.showGrid !== false,
    },
    completedJourney: raw.completedJourney === true || Object.keys(stars).length >= TOTAL_LEVELS,
    updatedAt: asInt(raw.updatedAt),
  }
}

/** Stars reward care, never speed: hints and resets lower them. */
export function starsFor({ hints = 0, resets = 0 } = {}) {
  if (hints === 0 && resets === 0) return 3
  if (hints <= 2 && resets <= 1) return 2
  return 1
}

export function unlockedAchievements(save) {
  return ACHIEVEMENTS.filter((achievement) => {
    try {
      return achievement.check(save)
    } catch {
      return false
    }
  })
}

export function unlockedThemes(save) {
  return THEMES.filter((theme) => save.levelsCleared >= theme.unlockAt).map((theme) => theme.id)
}

export function totalStars(save) {
  return Object.values(save.stars).reduce((sum, value) => sum + value, 0)
}

export function isUnlocked(save, levelNumber) {
  return levelNumber <= Math.max(1, save.unlocked)
}

function previousDate(date) {
  return new Date(Date.parse(`${date}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
}

function updateStreak(save, date) {
  if (save.streak.last === date) return
  save.streak.count = save.streak.last && previousDate(date) === save.streak.last ? save.streak.count + 1 : 1
  save.streak.last = date
}

/**
 * Record a finished puzzle. Never mutates its input, so a failed write cannot
 * corrupt the board the player is still looking at.
 */
export function recordResult(save, result = {}) {
  const {
    mode = 'journey',
    levelId = '',
    levelNumber = 0,
    stars = 0,
    hints = 0,
    resets = 0,
    rects = 0,
    irregular = false,
    difficulty = 1,
    date = new Date().toISOString().slice(0, 10),
  } = result

  const next = normalizeSave(save)
  const earned = Math.min(MAX_STARS, Math.max(1, Math.round(stars)))
  next.levelsCleared += 1
  next.totalRects += Math.max(0, Math.round(rects))
  next.hintsUsed += Math.max(0, Math.round(hints))
  if (hints === 0 && resets === 0) next.perfects += 1
  if (irregular) next.irregularClears += 1
  if (difficulty >= 4) next.expertClears += 1

  if (mode === 'journey' && levelId) {
    next.stars[levelId] = Math.max(next.stars[levelId] ?? 0, earned)
    delete next.placements[levelId]
    if (levelNumber > 0) next.unlocked = Math.min(TOTAL_LEVELS, Math.max(next.unlocked, levelNumber + 1))
    if (Object.keys(next.stars).length >= TOTAL_LEVELS) next.completedJourney = true
  } else if (mode === 'daily' && isDate(date)) {
    next.daily[date] = { stars: Math.max(next.daily[date]?.stars ?? 0, earned) }
    updateStreak(next, date)
  }

  const unlocked = unlockedThemes(next)
  if (!unlocked.includes(next.settings.theme)) {
    next.settings.theme = unlocked[unlocked.length - 1] ?? 'garden'
  }

  next.achievements = unlockedAchievements(next).map((achievement) => achievement.id)
  next.updatedAt = Date.now()
  return next
}

export function newlyUnlocked(before, after) {
  const had = new Set(before?.achievements ?? [])
  return ACHIEVEMENTS.filter((achievement) => after.achievements.includes(achievement.id) && !had.has(achievement.id))
}

/** A finished board is only worth saving once it actually covers the level. */
export function rememberPlacements(save, levelId, placements) {
  const next = normalizeSave(save)
  const key = String(levelId)
  if (!/^j\d{3}$/.test(key)) return next
  if (!Array.isArray(placements) || placements.length === 0) {
    delete next.placements[key]
  } else {
    next.placements[key] = placements.slice(0, 30).map(({ catId, x, y, width, height }) => ({ catId, x, y, width, height }))
  }
  next.updatedAt = Date.now()
  return next
}
