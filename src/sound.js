// Synthesised audio: no files to license, nothing loads until the first
// gesture. Warm, quiet sounds to match the wooden-toy look.

let ctx = null
export const audioState = { muted: false }

function audio() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, { type = 'sine', dur = 0.16, gain = 0.07, delay = 0, slide = 0 } = {}) {
  if (audioState.muted || !Number.isFinite(freq)) return
  const a = audio()
  if (!a) return
  const start = a.currentTime + delay
  const osc = a.createOscillator()
  const amp = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), start + dur)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.015)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(amp).connect(a.destination)
  osc.start(start)
  osc.stop(start + dur + 0.03)
}

function purr(delay = 0) {
  if (audioState.muted) return
  const a = audio()
  if (!a) return
  const dur = 0.5
  const start = a.currentTime + delay
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * 0.6
  }
  const source = a.createBufferSource()
  source.buffer = buffer
  const filter = a.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(260, start)
  const amp = a.createGain()
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.linearRampToValueAtTime(0.03, start + 0.1)
  amp.gain.linearRampToValueAtTime(0.0001, start + dur)
  // A slow tremolo reads as a purr rather than noise.
  const lfo = a.createOscillator()
  const lfoGain = a.createGain()
  lfo.frequency.value = 26
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain).connect(amp.gain)
  source.connect(filter).connect(amp).connect(a.destination)
  source.start(start)
  lfo.start(start)
  lfo.stop(start + dur)
}

export const sfx = {
  select: () => tone(520, { type: 'sine', dur: 0.07, gain: 0.04 }),
  place: () => {
    tone(320, { type: 'triangle', dur: 0.1, gain: 0.07 })
    tone(480, { type: 'sine', dur: 0.07, gain: 0.035, delay: 0.03 })
  },
  reject: () => tone(180, { type: 'sine', dur: 0.13, gain: 0.045, slide: -50 }),
  undo: () => tone(420, { type: 'triangle', dur: 0.09, gain: 0.05, slide: -120 }),
  hint: () => {
    tone(660, { type: 'sine', dur: 0.18, gain: 0.05 })
    tone(880, { type: 'sine', dur: 0.22, gain: 0.04, delay: 0.08 })
  },
  cat: () => purr(),
  meow: () => {
    tone(620, { type: 'sawtooth', dur: 0.16, gain: 0.02, slide: 260 })
    tone(880, { type: 'sine', dur: 0.12, gain: 0.03, delay: 0.05, slide: 120 })
  },
  complete: () => {
    ;[0, 4, 7, 12, 16].forEach((step, index) => {
      tone(523.25 * 2 ** (step / 12), { type: 'triangle', dur: 0.42, gain: 0.06, delay: index * 0.1 })
    })
    purr(0.4)
  },
  click: () => tone(600, { type: 'triangle', dur: 0.05, gain: 0.04 }),
  unlock: () => {
    tone(740, { type: 'sine', dur: 0.16, gain: 0.05 })
    tone(988, { type: 'sine', dur: 0.2, gain: 0.04, delay: 0.09 })
  },
}
