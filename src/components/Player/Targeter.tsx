import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../../systems/StabilitySystem'
import { Raycaster, Vector2, Vector3, Box3 } from 'three'
import type { Object3D } from 'three'

/**
 * Targeter casts a ray from the camera center into the scene.
 * If it hits a targetable element (buildings, props, NPCs), it flags its ID
 * in the game store and renders a neon 3D lock-on bounding box around it.
 */
export default function Targeter() {
  const { camera, scene } = useThree()
  const raycaster = useMemo(() => new Raycaster(), [])
  const center = useMemo(() => new Vector2(0, 0), [])
  const activeTarget = useGameStore((state) => state.activeTarget)
  const setActiveTarget = useGameStore((state) => state.setActiveTarget)

  const [targetPos, setTargetPos] = useState<Vector3 | null>(null)
  const [targetSize, setTargetSize] = useState<Vector3 | null>(null)

  const scratchV3 = useMemo(() => new Vector3(), [])
  const scratchBox = useMemo(() => new Box3(), [])

  useFrame(() => {
    // 1. Raycast from camera center
    raycaster.setFromCamera(center, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)

    let foundTargetName: string | null = null
    let foundTargetObj: Object3D | null = null

    const mutations = useGameStore.getState().worldMutations

    for (const intersect of intersects) {
      let obj = intersect.object
      while (obj) {
        // Find named groupings starting with targetable tags
        if (
          obj.name &&
          (obj.name.startsWith('building_') ||
            obj.name.startsWith('skyscraper_') ||
            obj.name.startsWith('low_building_') ||
            obj.name.startsWith('streetlight_') ||
            obj.name.startsWith('prop_') ||
            obj.name.startsWith('npc_'))
        ) {
          // Verify it has not been deleted
          const isDeleted = mutations[`delete:${obj.name}`]
          if (!isDeleted) {
            foundTargetName = obj.name
            foundTargetObj = obj
            break
          }
        }
        obj = obj.parent as any
      }
      if (foundTargetName) break
    }

    // Update Zustand state
    if (useGameStore.getState().activeTarget !== foundTargetName) {
      setActiveTarget(foundTargetName)
    }

    // 2. If we have a target, compute its 3D box and center coordinates
    if (foundTargetObj) {
      foundTargetObj.getWorldPosition(scratchV3)
      scratchBox.setFromObject(foundTargetObj)
      
      const size = new Vector3()
      scratchBox.getSize(size)
      const centerPos = new Vector3()
      scratchBox.getCenter(centerPos)

      setTargetPos(centerPos)
      setTargetSize(size)
    } else {
      setTargetPos(null)
      setTargetSize(null)
    }
  })

  // Rotate a ring or wireframe box around the locked target
  const ringRef = useRef<any>(null)
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.getElapsedTime() * 1.5
      ringRef.current.rotation.x = state.clock.getElapsedTime() * 0.4
    }
  })

  if (!activeTarget || !targetPos || !targetSize) return null

  // Draw a spinning neon targeting box at target coordinates
  const maxDim = Math.max(targetSize.x, targetSize.y, targetSize.z)

  return (
    <group position={targetPos}>
      {/* Locked Reticle: Holographic spinning wireframe sphere/box */}
      <mesh ref={ringRef}>
        <boxGeometry args={[targetSize.x * 1.05, targetSize.y * 1.05, targetSize.z * 1.05]} />
        <meshBasicMaterial
          color="#00f3ff"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Outer target ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[maxDim * 0.7, maxDim * 0.73, 8]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
