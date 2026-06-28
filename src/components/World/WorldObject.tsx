import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../systems/StabilitySystem'
import { Vector3 } from 'three'
import type { Group } from 'three'

interface WorldObjectProps {
  name: string
  type: 'building' | 'skyscraper' | 'lowDetail' | 'prop' | 'lamp' | 'npc'
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  cloneOffset?: [number, number, number]
  children: React.ReactNode
}

/**
 * WorldObject wraps any 3D entity in the simulation and applies reality mutations
 * (delete, clone, freeze, gravity) and environmental stability anomalies (jitter, float).
 *
 * Performance: the useFrame callback exits early (no work) when there are no
 * active mutations and the current act doesn't require per-frame effects.
 */
export default function WorldObject({
  name,
  type,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  cloneOffset = [0, 0, 5],
  children,
}: WorldObjectProps) {
  const groupRef = useRef<Group>(null)
  const innerRef = useRef<Group>(null)

  const currentAct = useGameStore((state) => state.currentAct)
  const mutations = useGameStore((state) => state.worldMutations)
  const isConsoleOpen = useGameStore((state) => state.isConsoleOpen)

  const isDeleted = mutations[`delete:${name}`]
  const isCloned = mutations[`clone:${name}`]
  const isFrozen = mutations[`freeze:${name}`]
  const isGravity = mutations[`gravity:${name}`]

  const hasMutation = isDeleted || isCloned || isFrozen || isGravity
  const needsPerFrame =
    hasMutation ||
    currentAct === 'act2' ||
    currentAct === 'act3' ||
    currentAct === 'act4' ||
    currentAct === 'act5'

  // Stable random parameters per instance
  const seedHash = useMemo(() => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash)
  }, [name])

  const phaseOffset = useMemo(() => (seedHash % 100) * 0.1, [seedHash])
  const driftSpeed = useMemo(() => 0.5 + (seedHash % 5) * 0.2, [seedHash])
  const driftAmplitude = useMemo(() => 1 + (seedHash % 3) * 0.8, [seedHash])

  const deleteTimerRef = useRef(0)
  const jitterTimerRef = useRef(0)
  const fullyHidden = useRef(false)

  // Set object name for raycast targeting
  useEffect(() => {
    if (groupRef.current) groupRef.current.name = name
  }, [name])

  // Scratch vectors (allocated once, reused)
  const _jitter = useMemo(() => new Vector3(), [])

  useFrame((state, delta) => {
    if (fullyHidden.current || !innerRef.current) return
    // Fast exit: no mutations and act doesn't need per-frame work
    if (!needsPerFrame) return
    
    // Scale delta for bullet time
    const dt = isConsoleOpen ? delta * 0.05 : delta

    const g = innerRef.current

    // 1. DELETE animation
    if (isDeleted) {
      deleteTimerRef.current += dt
      if (deleteTimerRef.current >= 1.0) {
        fullyHidden.current = true
        g.visible = false
        return
      }
      g.position.y += dt * 15
      const shrink = 1.0 - deleteTimerRef.current
      g.scale.multiplyScalar(shrink)
      return
    }

    // 2. GRAVITY float
    if (isGravity) {
      g.position.y += dt * 4 * driftSpeed
      g.rotation.x += dt * 0.3
      g.rotation.z += dt * 0.2
    }

    // 3. Act 2: Subtle glitches (1-frame disappear or flicker)
    if (currentAct === 'act2' && !isFrozen) {
      if (Math.random() < 0.001) {
        g.visible = false
      } else {
        g.visible = true
      }
    }

    // 4. Act 3 jitter (floating props)
    if (currentAct === 'act3' && !isFrozen) {
      if (Math.random() < 0.002 && jitterTimerRef.current <= 0) {
        jitterTimerRef.current = 0.25
      }
      if (jitterTimerRef.current > 0) {
        jitterTimerRef.current -= dt
        _jitter.set(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.4
        )
        g.position.x = position[0] + _jitter.x
        g.position.z = position[2] + _jitter.z
        
        // Small props float up slightly
        if (type === 'prop') {
          g.position.y = position[1] + 1.0 + Math.random() * 0.5
        }
      } else {
        if (type === 'prop') g.position.y = position[1]
      }
    }

    // 5. Act 4/5 hover & geometry disappearances
    if ((currentAct === 'act4' || currentAct === 'act5') && !isGravity && !isFrozen) {
      // Missing geometry
      if (Math.random() < 0.0005) {
        g.visible = !g.visible
      }
      
      // Floating objects
      if (type === 'prop' || type === 'lamp' || (type === 'building' && seedHash % 10 < 3)) {
        const t = state.clock.getElapsedTime()
        g.position.y =
          position[1] + Math.sin(t * 0.8 + phaseOffset) * 0.8 * driftAmplitude + (currentAct === 'act5' ? 5 : 2)
        g.rotation.z = rotation[2] + Math.sin(t * 0.3 + phaseOffset) * 0.05
        g.rotation.x = rotation[0] + Math.cos(t * 0.3 + phaseOffset) * 0.05
      }
    }
  })

  if (fullyHidden.current) return null

  const scaleArr: [number, number, number] =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <group ref={groupRef}>
      <group
        ref={innerRef}
        position={position}
        rotation={rotation}
        scale={scaleArr}
      >
        {children}

        {isFrozen && (
          <mesh>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshBasicMaterial
              color="#00f3ff"
              wireframe
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {isCloned && (
        <group
          position={[
            position[0] + cloneOffset[0],
            position[1] + cloneOffset[1],
            position[2] + cloneOffset[2],
          ]}
          rotation={rotation}
          scale={scaleArr}
        >
          {children}
          {/* Glitch wireframe shell to indicate it is a cloned anomaly */}
          <mesh>
            <boxGeometry args={[1.05, 1.05, 1.05]} />
            <meshBasicMaterial
              color="#0ea5e9"
              wireframe
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
