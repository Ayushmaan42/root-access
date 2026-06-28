import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore } from '../../systems/StabilitySystem'
import WorldObject from '../World/WorldObject'

interface SentinelProps {
  id: string
  startPosition: [number, number, number]
  playerPos: React.MutableRefObject<Vector3>
}

export default function Sentinel({ id, startPosition, playerPos }: SentinelProps) {
  const isDeleted = useGameStore((s) => s.worldMutations[`delete:${id}`])
  const isFrozen = useGameStore((s) => s.worldMutations[`freeze:${id}`])
  const takeDamage = useGameStore((s) => s.takeDamage)
  const isConsoleOpen = useGameStore((s) => s.isConsoleOpen)
  
  const body = useRef<RapierRigidBody>(null)
  const attackCooldown = useRef(0)

  // Scratch vectors for movement
  const dir = useMemo(() => new Vector3(), [])
  const currentPos = useMemo(() => new Vector3(), [])

  useFrame((_, delta) => {
    // Sentinels resist deletion in Act 3, but if they somehow get deleted, stop logic.
    if (isDeleted || !body.current) return
    
    // Stop moving completely if frozen
    if (isFrozen) {
      body.current.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true)
      return
    }

    // Bullet time modifier
    const dt = isConsoleOpen ? delta * 0.05 : delta
    
    // Current rigid body position
    const t = body.current.translation()
    currentPos.set(t.x, t.y, t.z)

    // Direction to player
    dir.copy(playerPos.current).sub(currentPos)
    const dist = dir.length()
    
    // Ignore Y distance for ground movement
    dir.y = 0
    dir.normalize()

    // Sentinels are very slow (speed 2) but have a wide attack range (3.0)
    if (dist > 2.5) {
      const speed = isConsoleOpen ? 2 * 0.05 : 2
      body.current.setLinvel({ x: dir.x * speed, y: body.current.linvel().y, z: dir.z * speed }, true)
    } else {
      // Stop and Attack
      body.current.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true)
    }
    
    // Attack logic
    if (attackCooldown.current > 0) {
      attackCooldown.current -= dt
    } else if (dist <= 3.0) { // Large Melee range
      attackCooldown.current = 2.0 // 1 hit per 2 seconds, very slow
      takeDamage(50) // Devastating damage
    }
  })

  return (
    <RigidBody ref={body} position={startPosition} colliders={false} lockRotations mass={500}>
      <CapsuleCollider args={[1.5, 1.0]} />
      {/* Visual */}
      <group position={[0, -2.5, 0]}>
        <WorldObject name={id} type="prop" position={[0, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.5, 5, 2.5]} />
            <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Glowing core */}
          <mesh position={[0, 1.5, 1.3]}>
            <boxGeometry args={[1, 1, 0.2]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={3} />
          </mesh>
        </WorldObject>
      </group>
    </RigidBody>
  )
}
