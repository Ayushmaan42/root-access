import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { Color, DirectionalLight, AmbientLight, Fog } from 'three'
import { useGameStore } from '../../systems/StabilitySystem'
import { getLayout, linePos } from '../../scenes/Act1/cityConfig'

/**
 * Visual configurations for the different stability thresholds.
 */
const ACT_CONFIGS = {
  act1: {
    // 100-90%: Perfect World (Golden Sunset)
    bg: new Color('#ff9c59'),
    fogNear: 80,
    fogFar: 250,
    dirColor: new Color('#fff5e0'),
    dirIntensity: 2.5,
    ambColor: new Color('#ffd5a0'),
    ambIntensity: 0.8,
    streetIntensity: 1.5,
    beaconIntensity: 2.0,
  },
  act2: {
    // 90-75%: First Cracks (Purple Evening)
    bg: new Color('#5a2b81'),
    fogNear: 60,
    fogFar: 200,
    dirColor: new Color('#d1a5ff'),
    dirIntensity: 1.5,
    ambColor: new Color('#7452a3'),
    ambIntensity: 0.5,
    streetIntensity: 2.5,
    beaconIntensity: 3.0,
  },
  act3: {
    // 75-55%: Reality Decay (Dark Blue/Purple)
    bg: new Color('#1a103c'),
    fogNear: 40,
    fogFar: 160,
    dirColor: new Color('#8b8bff'),
    dirIntensity: 0.8,
    ambColor: new Color('#2a1b54'),
    ambIntensity: 0.3,
    streetIntensity: 3.5,
    beaconIntensity: 4.0,
  },
  act4: {
    // 55-35%: Collapse (Stormy Dark)
    bg: new Color('#0a0c1a'),
    fogNear: 30,
    fogFar: 120,
    dirColor: new Color('#4a5588'),
    dirIntensity: 0.3,
    ambColor: new Color('#0d122b'),
    ambIntensity: 0.1,
    streetIntensity: 4.5,
    beaconIntensity: 5.0,
  },
  act5: {
    // <35%: The Dying World (Toxic Green / Neon Red)
    // We'll hardcode green here, but in Act 5 it will pulse dynamically via useFrame
    bg: new Color('#113311'),
    fogNear: 20,
    fogFar: 90,
    dirColor: new Color('#33ff33'),
    dirIntensity: 1.0,
    ambColor: new Color('#0a220a'),
    ambIntensity: 0.5,
    streetIntensity: 0,
    beaconIntensity: 0,
  }
}

export default function EnvironmentManager() {
  const currentAct = useGameStore((s) => s.currentAct)
  const stability = useGameStore((s) => s.stabilityPercent)
  
  // Refs for mutation without re-renders
  const dirLight = useRef<DirectionalLight>(null)
  const ambLight = useRef<AmbientLight>(null)
  
  // We attach fog and background directly to the scene, so we use useThree to grab scene
  const bgRef = useRef<Color>(new Color())
  const fogRef = useRef<Fog>(new Fog('#000000', 100, 200))
  
  // Create street lights and beacons
  const streetLights = useMemo(() => {
    const pts: Array<[number, number, number]> = []
    for (const ix of [2, 6]) {
      for (const iz of [3, 5]) {
        pts.push([linePos(ix), 4, linePos(iz)])
      }
    }
    return pts
  }, [])

  const beacons = useMemo(() => {
    return getLayout().skyscrapers.slice(0, 2).map((s): [number, number, number] => [
      s.position[0],
      s.scale * 3.2,
      s.position[2],
    ])
  }, [])

  // To pulse Act 5 colors
  const act5Timer = useRef(0)

  useFrame((state, delta) => {
    // 1. Determine target config based on current act
    // If we are in core or prologue, default to a safe baseline
    const targetKey = (currentAct === 'prologue' || currentAct === 'core') ? 'act5' : currentAct
    let target = ACT_CONFIGS[targetKey]

    // If Act 5, apply the dynamic pulsing (Green -> Purple -> Red -> Black)
    if (currentAct === 'act5' || stability < 35) {
      act5Timer.current += delta * 0.5 // Speed of color shifting
      const phase = act5Timer.current % 4
      
      // We mutate a scratch object to avoid creating new colors
      const scratch = { ...target }
      scratch.bg = new Color()
      scratch.dirColor = new Color()
      
      if (phase < 1) { // Green
        scratch.bg.setHex(0x113311)
        scratch.dirColor.setHex(0x33ff33)
      } else if (phase < 2) { // Purple
        scratch.bg.setHex(0x331144)
        scratch.dirColor.setHex(0xff33ff)
      } else if (phase < 3) { // Red
        scratch.bg.setHex(0x440505)
        scratch.dirColor.setHex(0xff1111)
      } else { // Black
        scratch.bg.setHex(0x000000)
        scratch.dirColor.setHex(0x111111)
      }
      target = scratch
    }

    // 2. Smoothly lerp current values towards target (0.05 speed)
    const lerpSpeed = delta * 2.0

    bgRef.current.lerp(target.bg, lerpSpeed)
    fogRef.current.color.copy(bgRef.current)
    fogRef.current.near += (target.fogNear - fogRef.current.near) * lerpSpeed
    fogRef.current.far += (target.fogFar - fogRef.current.far) * lerpSpeed
    
    // Apply to scene
    state.scene.background = bgRef.current
    state.scene.fog = fogRef.current

    if (dirLight.current) {
      dirLight.current.color.lerp(target.dirColor, lerpSpeed)
      dirLight.current.intensity += (target.dirIntensity - dirLight.current.intensity) * lerpSpeed
    }

    if (ambLight.current) {
      ambLight.current.color.lerp(target.ambColor, lerpSpeed)
      ambLight.current.intensity += (target.ambIntensity - ambLight.current.intensity) * lerpSpeed
    }
  })

  const currentConfig = ACT_CONFIGS[(currentAct === 'prologue' || currentAct === 'core') ? 'act5' : currentAct]

  return (
    <group>
      <directionalLight
        ref={dirLight}
        color={ACT_CONFIGS.act1.dirColor}
        intensity={ACT_CONFIGS.act1.dirIntensity}
        position={[100, 80, 50]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.6}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      <ambientLight 
        ref={ambLight}
        color={ACT_CONFIGS.act1.ambColor} 
        intensity={ACT_CONFIGS.act1.ambIntensity} 
      />

      {streetLights.map((p, i) => (
        <pointLight
          key={`street-${i}`}
          position={p}
          color="#ff9944"
          intensity={currentConfig.streetIntensity}
          distance={35}
          decay={2}
        />
      ))}

      {beacons.map((p, i) => (
        <pointLight
          key={`beacon-${i}`}
          position={p}
          color="#4488ff"
          intensity={currentConfig.beaconIntensity}
          distance={50}
          decay={2}
        />
      ))}

      <React.Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={currentAct === 'act1' ? 0.8 : 0.2} />
      </React.Suspense>
    </group>
  )
}
