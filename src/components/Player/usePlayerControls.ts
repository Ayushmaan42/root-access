import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

export interface PlayerControls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  run: boolean
}

/**
 * Keyboard input for the player. Returns a ref whose `.current` holds the live
 * button booleans — read it inside useFrame so key presses never trigger React
 * re-renders. WASD / arrows to move, Shift to run, Space to jump.
 */
export function usePlayerControls(): MutableRefObject<PlayerControls> {
  const controls = useRef<PlayerControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    run: false,
  })

  useEffect(() => {
    const set = (code: string, pressed: boolean) => {
      const c = controls.current
      switch (code) {
        case 'KeyW':
        case 'ArrowUp':
          c.forward = pressed
          break
        case 'KeyS':
        case 'ArrowDown':
          c.backward = pressed
          break
        case 'KeyA':
        case 'ArrowLeft':
          c.left = pressed
          break
        case 'KeyD':
        case 'ArrowRight':
          c.right = pressed
          break
        case 'Space':
          c.jump = pressed
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          c.run = pressed
          break
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Stop Space/arrows from scrolling the page.
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
      set(e.code, true)
    }
    const onKeyUp = (e: KeyboardEvent) => set(e.code, false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return controls
}
