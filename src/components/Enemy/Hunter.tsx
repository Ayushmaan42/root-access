import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore } from '../../systems/StabilitySystem'
import WorldObject from '../World/WorldObject'

interface HunterProps {
  id: string
  startPosition: [number, number, number]
  playerPos: React.MutableRefObject<Vector3>
}

export default function Hunter({ id, startPosition, playerPos }: HunterProps) {
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

    if (dist > 1.5) {
      // Move towards player at speed 8
      const speed = isConsoleOpen ? 8 * 0.05 : 8
      body.current.setLinvel({ x: dir.x * speed, y: body.current.linvel().y, z: dir.z * speed }, true)
    } else {
      // Stop and Attack
      body.current.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true)
    }
    
    // Attack logic
    if (attackCooldown.current > 0) {
      attackCooldown.current -= dt
    } else if (dist <= 2.0) { // Melee range
      attackCooldown.current = 1.0 // 1 hit per second
      takeDamage(15) // 15 damage
    }
  })

  return (
    <RigidBody ref={body} position={startPosition} colliders={false} lockRotations>
      <CapsuleCollider args={[0.5, 0.4]} />
      {/* Offset visual so it sits inside the capsule nicely */}
      <group position={[0, -0.9, 0]}>
        <WorldObject name={id} type="prop" position={[0, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.6, 1.8, 8]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Eye */}
          <mesh position={[0, 0.6, 0.45]}>
            <boxGeometry args={[0.6, 0.2, 0.1]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
          </mesh>
        </WorldObject>
      </group>
    </RigidBody>
  )
}
