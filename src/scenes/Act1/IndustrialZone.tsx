import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore } from '../../systems/StabilitySystem'
import WorldObject from '../../components/World/WorldObject'

function Crusher({ id, position, offset = 0 }: { id: string, position: [number, number, number], offset?: number }) {
  const isFrozen = useGameStore((s) => s.worldMutations[`freeze:${id}`])
  const bodyRef = useRef<RapierRigidBody>(null)
  
  // Fast moving speed
  const SPEED = 8
  const RANGE = 5

  useFrame(({ clock }) => {
    if (isFrozen || !bodyRef.current) return
    
    const t = clock.getElapsedTime() * SPEED + offset
    // Sine wave creates a crushing motion
    const yOffset = (Math.sin(t) + 1) * 0.5 * RANGE // 0 to RANGE
    
    bodyRef.current.setNextKinematicTranslation({
      x: position[0],
      y: position[1] + yOffset,
      z: position[2]
    })
  })

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={position}>
      <WorldObject name={id} type="building" position={[0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[8, 4, 8]} />
          <meshStandardMaterial color="#b91c1c" metalness={0.6} roughness={0.4} />
        </mesh>
      </WorldObject>
    </RigidBody>
  )
}

export default function IndustrialZone() {
  const currentAct = useGameStore((s) => s.currentAct)

  return (
    <group position={[-80, 0, 80]}>
      {/* Base platform */}
      <RigidBody type="fixed" position={[0, 5, 0]}>
        <WorldObject name="industrial_base" type="building" position={[0, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[40, 10, 40]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </WorldObject>
      </RigidBody>

      {/* The Crushers */}
      {/* They slam down to Y=10. The player must freeze them while they are raised to pass under. */}
      <Crusher id="prop_crusher_01" position={[-10, 10, 0]} offset={0} />
      <Crusher id="prop_crusher_02" position={[0, 10, 0]} offset={Math.PI / 2} />
      <Crusher id="prop_crusher_03" position={[10, 10, 0]} offset={Math.PI} />

      {/* Back Wall / Goal of this puzzle */}
      <RigidBody type="fixed" position={[0, 20, -20]}>
        <WorldObject name="industrial_wall" type="building" position={[0, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[40, 20, 2]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
        </WorldObject>
      </RigidBody>
    </group>
  )
}
