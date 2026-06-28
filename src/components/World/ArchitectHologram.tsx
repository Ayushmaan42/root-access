import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../systems/StabilitySystem'
import { Vector3 } from 'three'
import type { Mesh } from 'three'

export default function ArchitectHologram() {
  const currentAct = useGameStore((s) => s.currentAct)
  const isConsoleOpen = useGameStore((s) => s.isConsoleOpen)
  
  const meshRef = useRef<Mesh>(null)

  // Only show in Act 2-5 when dialogue is active or randomly glitching
  const currentDialogue = useGameStore((s) => s.currentDialogue)
  const isDialogueActive = currentDialogue !== null

  // The Architect watches from above the city center
  const centerPos = new Vector3(0, 150, 0)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    
    // Slowly rotate to stare down at the city
    meshRef.current.lookAt(0, 0, 20)
    
    // Glitch effect: scale pulsing and wireframe opacity shifts
    if (isDialogueActive) {
      meshRef.current.visible = true
      meshRef.current.scale.setScalar(40 + Math.sin(t * 5) * 1)
      const material = meshRef.current.material as any
      if (material) {
        material.opacity = 0.5 + Math.random() * 0.3
      }
    } else if (currentAct === 'act3' || currentAct === 'act4' || currentAct === 'act5') {
      // In later acts, the Architect occasionally flashes in the sky
      if (Math.random() < 0.005) {
        meshRef.current.visible = true
        meshRef.current.scale.setScalar(40 + Math.random() * 5)
        setTimeout(() => {
          if (meshRef.current) meshRef.current.visible = false
        }, 100)
      } else {
        meshRef.current.visible = false
      }
    } else {
      meshRef.current.visible = false
    }
  })

  return (
    <mesh ref={meshRef} position={centerPos} visible={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.5} />
    </mesh>
  )
}
