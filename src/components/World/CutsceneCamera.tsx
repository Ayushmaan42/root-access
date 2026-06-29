import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useCutsceneStore, CUTSCENE_DEFS, type CutsceneId } from '../../systems/CutsceneSystem'
import { useGameStore } from '../../systems/StabilitySystem'
import { startCinematicMusic, stopCinematicMusic } from '../../utils/sound'
import { getTerrainHeight } from '../../utils/terrain'

// ==========================================
// 1. CINEMATIC ACTORS & SUB-COMPONENTS
// ==========================================

interface ActorProps {
  active: boolean
  dialogueText: string
}

/**
 * Architect Holographic Face Actor
 * Floating giant head, blinks eyes, moves mouth with lip-sync to active dialog.
 */
function ArchitectFace({ active, dialogueText }: ActorProps) {
  const headRef = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Mesh>(null)
  const eyeLeftRef = useRef<THREE.Mesh>(null)
  const eyeRightRef = useRef<THREE.Mesh>(null)

  const isArchitectSpeaking = dialogueText.includes('[ARCHITECT]')

  // Find frozen player position so the Architect appears directly in front of them
  const spawnPos = useMemo(() => {
    const pPos = (window as any).__playerPosition as THREE.Vector3 | undefined
    if (pPos) {
      // Spawn 8 units in front of player
      return new THREE.Vector3(pPos.x, pPos.y + 2.8, pPos.z - 8)
    }
    return new THREE.Vector3(0, 5, 12)
  }, [active])

  useFrame((state) => {
    if (!active) return
    const t = state.clock.getElapsedTime()

    // Smooth head float
    if (headRef.current) {
      headRef.current.position.y = spawnPos.y + Math.sin(t * 1.5) * 0.25
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.1 // slight sway
    }

    // Lip sync mouth movements when speaking
    if (mouthRef.current) {
      if (isArchitectSpeaking) {
        mouthRef.current.scale.y = 1.0 + Math.sin(t * 18.0) * 0.75
        mouthRef.current.scale.x = 1.0 + Math.cos(t * 12.0) * 0.2
      } else {
        mouthRef.current.scale.y = 0.2
        mouthRef.current.scale.x = 1.0
      }
    }

    // Eye blinking sequence (every 3.5 seconds)
    const isBlinking = Math.floor(t) % 4 === 0 && (t % 1) < 0.15
    if (eyeLeftRef.current && eyeRightRef.current) {
      eyeLeftRef.current.scale.y = isBlinking ? 0.05 : 1.0
      eyeRightRef.current.scale.y = isBlinking ? 0.05 : 1.0
    }
  })

  if (!active) return null

  return (
    <group ref={headRef} position={[spawnPos.x, spawnPos.y, spawnPos.z]}>
      {/* Outer Hologram Dome */}
      <mesh castShadow>
        <sphereGeometry args={[1.6, 12, 12]} />
        <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Head Matrix Block */}
      <mesh castShadow>
        <boxGeometry args={[1.8, 1.8, 1.4]} />
        <meshStandardMaterial color="#b91c1c" emissive="#ef4444" emissiveIntensity={0.8} wireframe />
      </mesh>

      {/* Glowing Red Eyes (Facial Blinking) */}
      <mesh ref={eyeLeftRef} position={[-0.5, 0.3, 0.72]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color="#ff3b30" />
      </mesh>
      <mesh ref={eyeRightRef} position={[0.5, 0.3, 0.72]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color="#ff3b30" />
      </mesh>

      {/* Mouth Slot (Lip-Sync Scale) */}
      <mesh ref={mouthRef} position={[0, -0.4, 0.72]}>
        <boxGeometry args={[0.7, 0.15, 0.1]} />
        <meshBasicMaterial color="#ff3b30" />
      </mesh>

      <pointLight color="#ef4444" intensity={2} distance={10} />
    </group>
  )
}

/**
 * Rebel Leader Hologram Actor
 * Stands inside the base camp, performs talking arm gestures, and head tracks.
 */
function RebelHologram({ active, dialogueText }: ActorProps) {
  const rebelRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)

  const isRebelSpeaking = dialogueText.includes('[REBEL]')
  const yPos = getTerrainHeight(-250, -220)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.getElapsedTime()

    // Stand bobbing
    if (rebelRef.current) {
      rebelRef.current.position.y = yPos + Math.sin(t * 2.0) * 0.04
    }

    // Rebel head tracks surrounding campsite context
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.8) * 0.2
    }

    // Arm talk gestures
    if (leftArmRef.current && rightArmRef.current) {
      if (isRebelSpeaking) {
        leftArmRef.current.rotation.z = -0.5 + Math.sin(t * 6.0) * 0.4
        rightArmRef.current.rotation.x = Math.sin(t * 5.0) * 0.3
      } else {
        leftArmRef.current.rotation.z = -0.1
        rightArmRef.current.rotation.x = 0
      }
    }
  })

  if (!active) return null

  return (
    <group ref={rebelRef} position={[-248, yPos, -217]} rotation={[0, Math.PI / 4, 0]}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial color="#00ffff" wireframe />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 1.0, 6]} />
        <meshBasicMaterial color="#06b6d4" wireframe />
      </mesh>

      {/* Left Arm (talking joints) */}
      <mesh ref={leftArmRef} position={[-0.35, 1.3, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.07, 0.05, 0.7, 4]} />
        <meshBasicMaterial color="#0891b2" wireframe />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.35, 1.3, 0]}>
        <cylinderGeometry args={[0.07, 0.05, 0.7, 4]} />
        <meshBasicMaterial color="#0891b2" wireframe />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.15, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.6, 4]} />
        <meshBasicMaterial color="#06b6d4" wireframe />
      </mesh>
      <mesh position={[0.15, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.6, 4]} />
        <meshBasicMaterial color="#06b6d4" wireframe />
      </mesh>

      {PointLightHologram()}
    </group>
  )
}

function PointLightHologram() {
  return <pointLight color="#00ffff" intensity={1.5} distance={6} position={[0, 1, 0]} />
}

/**
 * Security Hover Drones
 * Hover scan rings, red spotlight cone searchlights scanning coordinates.
 */
function SecurityDrone({ position }: { position: [number, number, number] }) {
  const droneRef = useRef<THREE.Group>(null)
  const rotorsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!droneRef.current) return
    const t = state.clock.getElapsedTime()

    // Hover drift
    droneRef.current.position.y = position[1] + Math.sin(t * 3.0 + position[0]) * 0.15
    droneRef.current.position.x = position[0] + Math.cos(t * 1.5 + position[2]) * 0.1

    // Fast rotor spin
    if (rotorsRef.current) {
      rotorsRef.current.rotation.y = t * 35.0
    }
  })

  return (
    <group ref={droneRef} position={position}>
      {/* Drone Central Core */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.24, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Glowing Camera Scanner */}
      <mesh position={[0, -0.16, 0.35]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Propellers */}
      <group ref={rotorsRef} position={[0, 0.16, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.02, 0.08]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.2, 0.02, 0.08]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Red Searchlight Cone */}
      <mesh position={[0, -2.6, 0.2]} rotation={[0.15, 0, 0]}>
        <coneGeometry args={[1.2, 5.0, 8, 1, true]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Wireframe Boot Buildings
 * Construction wireframe grid lines built during game loading.
 */
function WireframeBoot({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!active || !meshRef.current) return
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15
  })

  if (!active) return null

  return (
    <group position={[0, 10, 0]}>
      {/* Radial construction grid */}
      <gridHelper args={[160, 20, '#00ffcc', '#02231c']} position={[0, -9.9, 0]} />

      {/* Central Construct Capsule */}
      <mesh ref={meshRef}>
        <boxGeometry args={[25, 25, 25]} />
        <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

/**
 * Architect Giant Boss Core
 * Inner pulsing code sphere, nested rotating toruses and dodecahedrons.
 */
function ArchitectBossCore({ active }: { active: boolean }) {
  const outerRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!active) return
    const t = state.clock.getElapsedTime()

    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.4
      outerRef.current.rotation.x = t * 0.2
    }

    if (innerRef.current) {
      const scale = 1.0 + Math.sin(t * 6) * 0.12
      innerRef.current.scale.set(scale, scale, scale)
    }
  })

  if (!active) return null

  return (
    <group position={[0, 18, 0]}>
      {/* 1. Pulsing Core Sphere */}
      <mesh ref={innerRef} castShadow>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={3} roughness={0.1} />
      </mesh>

      {/* 2. Nested Rotating Rings */}
      <group ref={outerRef}>
        <mesh>
          <dodecahedronGeometry args={[5.0, 1]} />
          <meshBasicMaterial color="#ff3b30" wireframe transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[7.0, 0.25, 8, 32]} />
          <meshBasicMaterial color="#00f3ff" wireframe />
        </mesh>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[8.5, 0.15, 6, 24]} />
          <meshBasicMaterial color="#ec4899" wireframe />
        </mesh>
      </group>

      <pointLight color="#ef4444" intensity={4} distance={30} />
    </group>
  )
}


// ==========================================
// 2. MAIN CINEMATIC MANAGER CAMERA DIRECTOR
// ==========================================

export default function CutsceneCamera() {
  const camera = useThree((s) => s.camera)
  const activeCutscene = useCutsceneStore((s) => s.activeCutscene)
  const endCutscene = useCutsceneStore((s) => s.endCutscene)
  
  const currentDialogue = useGameStore((s) => s.currentDialogue)
  const dialogueIndex = useGameStore((s) => s.dialogueIndex)

  const currentTimeline = useRef<gsap.core.Timeline | null>(null)
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0))

  // Custom Camera Shake magnitude updated during timeline events
  const cameraShake = useRef(0)

  // Track typewriter subtitle lines for lipsync bindings
  const currentLineText = currentDialogue && currentDialogue[dialogueIndex] ? currentDialogue[dialogueIndex] : ''

  // Trigger sequences and background music tracks
  useEffect(() => {
    if (!activeCutscene) {
      stopCinematicMusic()
      if (currentTimeline.current) {
        currentTimeline.current.kill()
        currentTimeline.current = null
      }
      cameraShake.current = 0
      return
    }

    const def = CUTSCENE_DEFS[activeCutscene]
    if (!def) return

    if (currentTimeline.current) {
      currentTimeline.current.kill()
    }

    // 1. Audio Director: Play procedurally synthesized backing pads
    if (activeCutscene === 'world_normal') startCinematicMusic('ambient')
    else if (activeCutscene === 'architect_notices') startCinematicMusic('tense')
    else if (activeCutscene === 'city_distortion') startCinematicMusic('tense')
    else if (activeCutscene === 'hidden_layer') startCinematicMusic('ambient')
    else if (activeCutscene === 'the_rebels') startCinematicMusic('ambient')
    else if (activeCutscene === 'architect_warning') startCinematicMusic('tense')
    else if (activeCutscene === 'worldwide_glitch') startCinematicMusic('climax')
    else if (activeCutscene === 'last_defense') startCinematicMusic('climax')
    else if (activeCutscene === 'approach_core') startCinematicMusic('tense')
    else if (activeCutscene === 'confrontation') startCinematicMusic('climax')
    else if (activeCutscene.startsWith('ending')) startCinematicMusic('ending')

    // Timeline Sequencer initialization
    const tl = gsap.timeline({
      onComplete: () => {
        endCutscene()
      }
    })
    currentTimeline.current = tl

    // 2. Camera Director: Configure Crane, Follow, and Pan Sweeps
    switch (activeCutscene) {
      case 'world_normal': {
        // Cutscene 1 — Game Opening: Wide sunset aerial pan descending to player
        lookTarget.current.set(0, 12, 0)
        camera.position.set(-130, 60, 130)
        
        tl.to(camera.position, {
          x: 0,
          y: 3,
          z: 28.5,
          duration: def.duration,
          ease: 'power2.inOut',
          onUpdate: () => {
            const progress = tl.progress()
            lookTarget.current.set(0, 12 - progress * 10.8, 24 - progress * 3)
          }
        })
        break
      }
      case 'first_glitch': {
        // Cutscene 2 — First Glitch Discovery: Focus close up on decompiler terminal
        lookTarget.current.set(0, 1.2, 24)
        camera.position.set(0, 2.5, 29)
        cameraShake.current = 0.05 // Slight focus vibration
        
        tl.to(camera.position, {
          x: -1.0,
          y: 1.4,
          z: 26.0,
          duration: def.duration,
          ease: 'sine.inOut',
          onUpdate: () => {
            lookTarget.current.set(0, 1.2, 24)
          }
        })
        break
      }
      case 'architect_notices': {
        // Cutscene 3 — The Architect Notices You: Fast camera cuts following flying drones
        lookTarget.current.set(0, 10, 18)
        camera.position.set(5, 14, 25)
        cameraShake.current = 0.08
        
        tl.to(camera.position, {
          x: -5,
          y: 8,
          z: 16,
          duration: def.duration,
          ease: 'power1.inOut',
          onUpdate: () => {
            const p = tl.progress()
            if (p < 0.35) {
              lookTarget.current.set(2, 8, 20)
            } else if (p < 0.7) {
              lookTarget.current.set(-2, 9, 23)
            } else {
              lookTarget.current.set(0, 2, 24)
            }
          }
        })
        break
      }
      case 'city_distortion': {
        // Cutscene 4 — City Distortion: Crane shot panning up as structures shift
        lookTarget.current.set(0, 10, 0)
        camera.position.set(0, 6, 28)
        cameraShake.current = 0.12 // Shake screen to show force
        
        tl.to(camera.position, {
          x: -25,
          y: 35,
          z: 55,
          duration: def.duration,
          ease: 'power2.inOut',
          onUpdate: () => {
            lookTarget.current.set(0, 10 + tl.progress() * 12, 0)
          }
        })
        break
      }
      case 'hidden_layer': {
        // Cutscene 5 — Discovery of the Hidden Layer: Camera dives below city grid
        lookTarget.current.set(0, 2, 24)
        camera.position.set(0, 5, 29)
        
        tl.to(camera.position, {
          x: 0,
          y: -14,
          z: 22,
          duration: def.duration,
          ease: 'power3.inOut',
          onUpdate: () => {
            lookTarget.current.set(0, -12, 10)
          }
        })
        break
      }
      case 'the_rebels': {
        // Cutscene 6 — The Rebels: Horizontal tracking sweep inside rebel base camp
        lookTarget.current.set(-248, getTerrainHeight(-250, -220) + 1.0, -217) // focus on rebel hologram
        camera.position.set(-240, getTerrainHeight(-250, -220) + 2.0, -205)
        
        tl.to(camera.position, {
          x: -256,
          y: getTerrainHeight(-250, -220) + 1.2,
          z: -212,
          duration: def.duration,
          ease: 'sine.inOut',
          onUpdate: () => {
            lookTarget.current.set(-248, getTerrainHeight(-250, -220) + 1.0, -217)
          }
        })
        break
      }
      case 'architect_warning': {
        // Cutscene 7 — Architect's Warning: Orbit around player and the face
        const pPos = (window as any).__playerPosition as THREE.Vector3 | undefined
        const bx = pPos ? pPos.x : 0
        const bz = pPos ? pPos.z : 24
        lookTarget.current.set(bx, 2.5, bz - 4)
        camera.position.set(bx + 4, 3, bz)

        const orbit = { angle: 0 }
        tl.to(orbit, {
          angle: Math.PI * 1.5,
          duration: def.duration,
          ease: 'power1.inOut',
          onUpdate: () => {
            camera.position.x = bx + Math.sin(orbit.angle) * 5.5
            camera.position.z = (bz - 4) + Math.cos(orbit.angle) * 5.5
            camera.position.y = 2.4 + (orbit.angle / Math.PI) * 0.6
            lookTarget.current.set(bx, 2.5, bz - 4)
          }
        })
        break
      }
      case 'worldwide_glitch': {
        // Cutscene 8 — Worldwide Glitch: Dynamic zoom showing mountains shaking
        lookTarget.current.set(170, 8, -170)
        camera.position.set(-90, 50, 180)
        cameraShake.current = 0.16 // Intense shake
        
        tl.to(camera.position, {
          x: 100,
          y: 70,
          z: -160,
          duration: def.duration,
          ease: 'none',
          onUpdate: () => {
            lookTarget.current.set(170 - tl.progress() * 300, 8, -170)
          }
        })
        break
      }
      case 'memory_vault': {
        // Cutscene 9 — Memory Vault: Vertically climbing camera shot
        lookTarget.current.set(0, 10, 48)
        camera.position.set(0, 2, 56)
        
        tl.to(camera.position, {
          y: 26,
          z: 42,
          duration: def.duration,
          ease: 'power1.inOut',
          onUpdate: () => {
            lookTarget.current.set(0, 10 + tl.progress() * 12, 48)
          }
        })
        break
      }
      case 'last_defense': {
        // Cutscene 10 — Last Defense: Zoom sweep looking up at the Core
        lookTarget.current.set(0, 15, 0)
        camera.position.set(0, 4, 30)
        cameraShake.current = 0.1
        
        tl.to(camera.position, {
          x: 20,
          y: 28,
          z: 32,
          duration: def.duration,
          ease: 'power2.out',
          onUpdate: () => {
            lookTarget.current.set(0, 15, 0)
          }
        })
        break
      }
      case 'approach_core': {
        // Cutscene 11 — Final Approach: Slow walking follow cam behind player
        lookTarget.current.set(0, 1.2, 2)
        camera.position.set(0, 2.5, 9)
        
        tl.to(camera.position, {
          z: 3.8,
          y: 1.4,
          duration: def.duration,
          ease: 'none',
          onUpdate: () => {
            lookTarget.current.set(0, 1.2, -1)
          }
        })
        break
      }
      case 'confrontation': {
        // Cutscene 12 — The Architect Boss Confrontation: 360 orbit around core
        lookTarget.current.set(0, 18, 0)
        camera.position.set(0, 18, 12)
        
        const rot = { val: 0 }
        tl.to(rot, {
          val: Math.PI * 1.8,
          duration: def.duration,
          ease: 'sine.inOut',
          onUpdate: () => {
            camera.position.x = Math.sin(rot.val) * 11
            camera.position.z = Math.cos(rot.val) * 11
            camera.position.y = 18 + Math.sin(rot.val) * 2
            lookTarget.current.set(0, 18, 0)
          }
        })
        break
      }
      case 'ending_reboot': {
        // Ending A — Reboot: Rise and scan down
        lookTarget.current.set(0, 1, 0)
        camera.position.set(0, 1.5, 6)
        
        tl.to(camera.position, {
          x: 0,
          y: 55,
          z: 0.1,
          duration: def.duration,
          ease: 'power2.inOut',
          onUpdate: () => {
            lookTarget.current.set(0, 0, 0)
          }
        })
        break
      }
      case 'ending_freedom': {
        // Ending B — Freedom: Backward zoom into white space
        lookTarget.current.set(0, 1, 0)
        camera.position.set(0, 1.5, 4)
        
        tl.to(camera.position, {
          z: 50,
          y: 10,
          duration: def.duration,
          ease: 'power3.inOut',
          onUpdate: () => {
            lookTarget.current.set(0, 1, 0)
          }
        })
        break
      }
      case 'ending_collapse': {
        // Ending C — Collapse: Sideways slam crash
        lookTarget.current.set(0, 1, 0)
        camera.position.set(0, 1.8, 5)
        cameraShake.current = 0.25
        
        tl.to(camera.position, {
          x: 6,
          y: -4,
          z: 1.5,
          duration: def.duration,
          ease: 'bounce.out',
          onUpdate: () => {
            lookTarget.current.set(0, 1, 0)
          }
        })
        break
      }
    }

    return () => {
      tl.kill()
    }
  }, [activeCutscene, endCutscene, camera])

  // Apply real-time camera shakes and lookAt adjustments
  useFrame(() => {
    if (activeCutscene) {
      camera.lookAt(lookTarget.current)
      
      // Perform screen vibrations/shakes on intensive moments
      if (cameraShake.current > 0) {
        camera.position.x += (Math.random() - 0.5) * cameraShake.current
        camera.position.y += (Math.random() - 0.5) * cameraShake.current
        camera.position.z += (Math.random() - 0.5) * cameraShake.current
      }
    }
  })

  // 3. Dialogue Director: Render subcomponents for visual actors in the R3F Canvas
  return (
    <group>
      {/* Game Opening Boot Wireframes */}
      <WireframeBoot active={activeCutscene === 'world_normal'} />

      {/* Security Hover Drones deployed when Architect Notices You */}
      {activeCutscene === 'architect_notices' && (
        <group>
          <SecurityDrone position={[2, 9, 20]} />
          <SecurityDrone position={[-3, 8.5, 23]} />
          <SecurityDrone position={[0, 11, 17]} />
        </group>
      )}

      {/* Rebel Leader Hologram inside Base */}
      <RebelHologram active={activeCutscene === 'the_rebels'} dialogueText={currentLineText} />

      {/* Architect giant head warning the player */}
      <ArchitectFace 
        active={activeCutscene === 'architect_warning' || activeCutscene === 'last_defense'} 
        dialogueText={currentLineText} 
      />

      {/* Architect Boss Core Final Form */}
      <ArchitectBossCore active={activeCutscene === 'confrontation'} />
    </group>
  )
}
