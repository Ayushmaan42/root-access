import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../systems/StabilitySystem'
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
  ChromaticAberration,
  Glitch,
  Noise,
  HueSaturation,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'

/**
 * Dynamic PostProcessingManager adjusts visual rendering based on simulation stability.
 * Acts 1-5 transitions from bright HDR to grayscale, high-distortion glitch void.
 */
export default function PostProcessingManager() {
  const currentAct = useGameStore((state) => state.currentAct)
  const commandsUsed = useGameStore((state) => state.commandsUsed)

  const prevCommands = useRef(commandsUsed)
  const pulseTimer = useRef(0)

  // Track command uses to trigger a brief chromatic aberration pulse
  useFrame((_, delta) => {
    if (commandsUsed > prevCommands.current) {
      pulseTimer.current = 0.5 // pulse for 500ms
      prevCommands.current = commandsUsed
    }

    if (pulseTimer.current > 0) {
      pulseTimer.current -= delta
    }
  })

  // Compute chromatic aberration offset based on act and pulse trigger
  const abOffset = useMemo(() => {
    const base = new Vector2(0, 0)
    
    // Base act aberrations
    if (currentAct === 'act2') base.set(0.002, 0.002)
    else if (currentAct === 'act3') base.set(0.005, 0.005)
    else if (currentAct === 'act4') base.set(0.012, 0.012)
    else if (currentAct === 'act5') base.set(0.025, 0.025)

    // Pulse multiplier
    if (pulseTimer.current > 0) {
      const scale = 1.0 + (pulseTimer.current / 0.5) * 4.0 // up to 5x spike
      base.multiplyScalar(scale)
    }

    return base
  }, [currentAct, commandsUsed])

  // Desaturation scale (saturation: 0 is default, -1 is full grayscale)
  const saturation = useMemo(() => {
    if (currentAct === 'prologue' || currentAct === 'act1') return 0
    if (currentAct === 'act2') return -0.15
    if (currentAct === 'act3') return -0.45
    if (currentAct === 'act4') return -0.75
    if (currentAct === 'act5') return -1.0 // total dead void
    return 0
  }, [currentAct])

  // Noise opacity
  const noiseOpacity = useMemo(() => {
    if (currentAct === 'act3') return 0.06
    if (currentAct === 'act4') return 0.15
    if (currentAct === 'act5') return 0.35
    return 0
  }, [currentAct])

  // Glitch parameters
  const isGlitchActive = currentAct === 'act3' || currentAct === 'act4' || currentAct === 'act5'
  const glitchDelay = useMemo<[number, number]>(() => {
    if (currentAct === 'act4') return [0.5, 1.8]
    if (currentAct === 'act5') return [0.1, 0.6] // constant stuttering
    return [1.5, 4.0] // occasional
  }, [currentAct])

  return (
    <EffectComposer>
      {/* Bloom - subtle warm glow that increases in act 2/3 and turns into a blown-out exposure in act 4 */}
      <Bloom
        luminanceThreshold={currentAct === 'act4' || currentAct === 'act5' ? 0.3 : 0.6}
        intensity={currentAct === 'act4' || currentAct === 'act5' ? 2.5 : 0.8}
        mipmapBlur
      />

      {/* Screen Vignette */}
      <Vignette darkness={currentAct === 'act5' ? 0.75 : 0.5} offset={0.3} />

      {/* Tone Mapping */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

      {/* Dynamic Chromatic Aberration */}
      <ChromaticAberration offset={abOffset} />

      {/* Dynamic Jitter Glitch */}
      <Glitch
        delay={new Vector2(glitchDelay[0], glitchDelay[1])}
        duration={new Vector2(0.1, 0.45)}
        strength={new Vector2(0.4, 1.2)}
        active={isGlitchActive}
      />

      {/* Ambient static Noise */}
      <Noise opacity={noiseOpacity} />

      {/* Grayscale color grading */}
      <HueSaturation saturation={saturation} />
    </EffectComposer>
  )
}
