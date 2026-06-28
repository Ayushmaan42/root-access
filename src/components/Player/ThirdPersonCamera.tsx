import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Vector3 } from 'three'
import { useGameStore } from '../../systems/StabilitySystem'

const DISTANCE = 5 // units behind the player
const HEIGHT = 2 // units above the player
const LOOK_HEIGHT = 1.2 // aim at the player's upper body
const MOUSE_SENSITIVITY = 0.005
const HANDOFF_MS = 4100 // let the cinematic intro pan finish first

interface ThirdPersonCameraProps {
  /** Shared vector written by the Player each frame. */
  targetRef: RefObject<Vector3>
}

/**
 * Follows the player from behind and slightly above with a smooth, frame-rate
 * independent lerp. The mouse orbits the camera horizontally (while pointer is
 * locked). A single physics raycast pulls the camera in so it never clips
 * through buildings — far cheaper than raycasting the whole scene graph.
 */
export default function ThirdPersonCamera({ targetRef }: ThirdPersonCameraProps) {
  const camera = useThree((s) => s.camera)
  const { world, rapier } = useRapier()

  const yaw = useRef(0)
  const active = useRef(false)

  const from = useMemo(() => new Vector3(), [])
  const desired = useMemo(() => new Vector3(), [])
  const dir = useMemo(() => new Vector3(), [])
  const lookAt = useMemo(() => new Vector3(), [])

  // Horizontal orbit from mouse movement (only while pointer-locked).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement && !useGameStore.getState().isConsoleOpen) {
        yaw.current -= e.movementX * MOUSE_SENSITIVITY
      }
    }
    const onClick = () => {
      if (!document.pointerLockElement && document.activeElement?.tagName !== 'INPUT') {
        document.body.requestPointerLock().catch(() => {})
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
    }
  }, [])

  // Take over from the cinematic intro pan.
  useEffect(() => {
    const id = window.setTimeout(() => {
      active.current = true
    }, HANDOFF_MS)
    return () => window.clearTimeout(id)
  }, [])

  useFrame((_, delta) => {
    if (!active.current || !targetRef.current) return
    const target = targetRef.current

    // Desired camera position: offset behind (by yaw) and above the player.
    desired
      .set(Math.sin(yaw.current), 0, Math.cos(yaw.current))
      .multiplyScalar(DISTANCE)
      .add(target)
    desired.y = target.y + HEIGHT

    // Cheap collision: one physics ray from above the player out to the camera.
    // The origin sits above the capsule, so it never self-hits the player.
    from.set(target.x, target.y + LOOK_HEIGHT, target.z)
    dir.copy(desired).sub(from)
    const fullDist = dir.length()
    if (fullDist > 0.001) {
      dir.divideScalar(fullDist)
      const ray = new rapier.Ray(
        { x: from.x, y: from.y, z: from.z },
        { x: dir.x, y: dir.y, z: dir.z }
      )
      const hit = world.castRay(ray, fullDist, true)
      if (hit) {
        desired
          .copy(from)
          .addScaledVector(dir, Math.max(0.6, hit.timeOfImpact - 0.3))
      }
    }

    // Very fast lerp — feels instant but eliminates single-frame jitter
    camera.position.lerp(desired, 1 - Math.exp(-25 * delta))
    lookAt.set(target.x, target.y + LOOK_HEIGHT, target.z)
    camera.lookAt(lookAt)
  })

  return null
}
