import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Vector3 } from 'three'
import gsap from 'gsap'
import CityGrid from './CityGrid'
import RoadNetwork from './RoadNetwork'
import CyberpunkDetails from './CyberpunkDetails'
import Lighting from './Lighting'
import Player from '../../components/Player'
import ThirdPersonCamera from '../../components/Player/ThirdPersonCamera'
import NPCManager from '../../components/NPC/NPCManager'
import Targeter from '../../components/Player/Targeter'
import { PostProcessingManager } from '../../components/VFX'

/**
 * 4-second cinematic dolly across the city on load, then it simply rests.
 * Control will later hand off to the player (not added yet).
 */
function CinematicCamera() {
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const lookTarget = new Vector3(0, 10, 0)
    camera.position.set(-95, 30, 95)
    camera.lookAt(lookTarget)

    const tl = gsap.timeline()
    tl.to(camera.position, {
      x: 95,
      z: 95,
      duration: 4,
      ease: 'power1.inOut',
      onUpdate: () => camera.lookAt(lookTarget),
    })

    return () => {
      tl.kill()
    }
  }, [camera])

  return null
}

/** Black boot overlay shown before the simulation renders. */
function EnteringSimulation() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '1rem',
        letterSpacing: '0.35em',
      }}
    >
      ENTERING SIMULATION...
    </div>
  )
}

export default function Act1Scene() {
  // Shared position the player writes and the camera follows.
  const playerPos = useRef(new Vector3(0, 2, 24))

  return (
    <Suspense fallback={<EnteringSimulation />}>
      <Canvas
        shadows="basic"
        camera={{ fov: 60, position: [0, 8, 20] }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: false }}
      >
        <Suspense fallback={null}>
          <Sky
            distance={450000}
            sunPosition={[100, 20, 100]}
            rayleigh={0.5}
            turbidity={2}
          />
          <fog attach="fog" args={['#c8e0ff', 80, 220]} />
          <Lighting />
          <Physics>
            <CityGrid />
            <RoadNetwork />
            <CyberpunkDetails />
            <NPCManager />
            <Player targetRef={playerPos} />
            <ThirdPersonCamera targetRef={playerPos} />
          </Physics>
          <PostProcessingManager />
          <CinematicCamera />
          <Targeter />
        </Suspense>
      </Canvas>
    </Suspense>
  )
}
