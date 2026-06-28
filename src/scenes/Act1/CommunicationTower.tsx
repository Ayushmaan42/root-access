import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useGameStore } from '../../systems/StabilitySystem'
import WorldObject from '../../components/World/WorldObject'

export default function CommunicationTower() {
  const currentAct = useGameStore((s) => s.currentAct)
  const isCloned = useGameStore((s) => s.worldMutations['clone:prop_bridge_01'])

  return (
    <group position={[80, 0, -80]}>
      {/* Starting Platform before the gap */}
      <RigidBody type="fixed" position={[0, 10, 40]}>
        <WorldObject name="platform_start" type="building" position={[0, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[10, 1, 10]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
        </WorldObject>
      </RigidBody>

      {/* The cloneable bridge segment */}
      <RigidBody type="fixed" position={[0, 10, 30]}>
        <WorldObject name="prop_bridge_01" type="prop" position={[0, 0, 0]} cloneOffset={[0, 0, -10]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[4, 0.5, 10]} />
            <meshStandardMaterial color="#0ea5e9" metalness={0.5} roughness={0.2} />
          </mesh>
        </WorldObject>
      </RigidBody>

      {/* The far platform (reached by cloning the bridge) */}
      <RigidBody type="fixed" position={[0, 10, 10]}>
        <WorldObject name="platform_end" type="building" position={[0, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[10, 1, 10]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
        </WorldObject>
      </RigidBody>

      {/* Tower Base */}
      <WorldObject name="comm_tower_base" type="building" position={[0, 20, 0]}>
        <RigidBody type="fixed" colliders="hull">
          <mesh>
            <cylinderGeometry args={[10, 15, 40, 8]} />
            <meshStandardMaterial color="#1f2937" metalness={0.8} />
          </mesh>
        </RigidBody>
      </WorldObject>
    </group>
  )
}

