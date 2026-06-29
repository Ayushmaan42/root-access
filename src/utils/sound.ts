/**
 * Web Audio API synthesizer for retro-hacker UI sound effects.
 * Avoids the need for external asset files.
 */

let audioCtx: AudioContext | null = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

export function playSynthBeep(freq = 800, duration = 0.05, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (e) {
    // Audio context not allowed or failed
    // eslint-disable-next-line no-console
    console.warn('Audio play failed', e)
  }
}

export function playKeySound() {
  // A very short high pitch beep for typewriter click
  playSynthBeep(1200 + Math.random() * 400, 0.015, 'triangle')
}

export function playSuccessSound() {
  // Quick double ascending chirp
  playSynthBeep(600, 0.08, 'sine')
  setTimeout(() => {
    playSynthBeep(900, 0.12, 'sine')
  }, 80)
}

export function playErrorSound() {
  // Low dirty buzz
  playSynthBeep(150, 0.25, 'sawtooth')
}

export function playGlitchSound() {
  // Rapid randomized pitch bursts
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    
    // Play 4 quick clicks
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        playSynthBeep(300 + Math.random() * 1500, 0.03, 'sawtooth')
      }, i * 40)
    }
  } catch (e) {
    // Ignore audio context errors
  }
}

let bgOscs: { osc: OscillatorNode; gain: GainNode }[] = []

export function startCinematicMusic(type: 'ambient' | 'tense' | 'climax' | 'ending') {
  stopCinematicMusic()
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    const freqs = 
      type === 'ambient' ? [110, 165, 220] :
      type === 'tense' ? [98, 147, 196] :
      type === 'climax' ? [87, 130, 174] :
      [130, 196, 260] // ending
      
    freqs.forEach((f) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type === 'climax' ? 'sawtooth' : 'triangle'
      osc.frequency.setValueAtTime(f, ctx.currentTime)
      
      // Pulse gain slightly over time
      gain.gain.setValueAtTime(0.015, ctx.currentTime)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      bgOscs.push({ osc, gain })
    })
  } catch (e) {
    // Ignore context errors
  }
}

export function stopCinematicMusic() {
  bgOscs.forEach(({ osc, gain }) => {
    try {
      osc.stop()
      osc.disconnect()
      gain.disconnect()
    } catch (e) {}
  })
  bgOscs = []
}
