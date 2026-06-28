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
  position,
  rotation = [0, 0, 0],
  scale = 1,
  children,
}: WorldObjectProps) {
  const groupRef = useRef<Group>(null)
  const innerRef = useRef<Group>(null)

  const currentAct = useGameStore((state) => state.currentAct)
  const mutations = useGameStore((state) => state.worldMutations)

  const isDeleted = mutations[`delete:${name}`]
  const isCloned = mutations[`clone:${name}`]
  const isFrozen = mutations[`freeze:${name}`]
  const isGravity = mutations[`gravity:${name}`]

  const hasMutation = isDeleted || isCloned || isFrozen || isGravity
  const needsPerFrame =
    hasMutation ||
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

    const g = innerRef.current

    // 1. DELETE animation
    if (isDeleted) {
      deleteTimerRef.current += delta
      if (deleteTimerRef.current >= 1.0) {
        fullyHidden.current = true
        g.visible = false
        return
      }
      g.position.y += delta * 15
      const shrink = 1.0 - deleteTimerRef.current
      g.scale.multiplyScalar(shrink)
      return
    }

    // 2. GRAVITY float
    if (isGravity) {
      g.position.y += delta * 4 * driftSpeed
      g.rotation.x += delta * 0.3
      g.rotation.z += delta * 0.2
    }

    // 3. Act 3 jitter
    if (currentAct === 'act3' && !isFrozen) {
      if (Math.random() < 0.002 && jitterTimerRef.current <= 0) {
        jitterTimerRef.current = 0.25
      }
      if (jitterTimerRef.current > 0) {
        jitterTimerRef.current -= delta
        _jitter.set(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.4
        )
        g.position.x = position[0] + _jitter.x
        g.position.z = position[2] + _jitter.z
      }
    }

    // 4. Act 4/5 hover
    if ((currentAct === 'act4' || currentAct === 'act5') && !isGravity && !isFrozen) {
      const t = state.clock.getElapsedTime()
      g.position.y =
        position[1] + Math.sin(t * 0.8 + phaseOffset) * 0.8 * driftAmplitude
      g.rotation.z = rotation[2] + Math.sin(t * 0.3 + phaseOffset) * 0.05
      g.rotation.x = rotation[0] + Math.cos(t * 0.3 + phaseOffset) * 0.05
    }
  })

  if (fullyHidden.current) return null

  const scaleArr: [number, number, number] =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  // Clone positions for the CLONE mutation
  const clonePositions: [number, number, number][] = isCloned
    ? [
        [position[0] + 9, position[1], position[2] - 9],
        [position[0] - 11, position[1], position[2] + 7],
        [position[0] + 5, position[1], position[2] + 13],
      ]
    : []

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

      {isCloned &&
        clonePositions.map((clonePos, idx) => (
          <group
            key={`clone-${idx}`}
            position={clonePos}
            rotation={[rotation[0], rotation[1] + (idx + 1) * 0.5, rotation[2]]}
            scale={scaleArr.map((s) => s * 0.9) as [number, number, number]}
          >
            {children}
          </group>
        ))}
    </group>
  )
}
