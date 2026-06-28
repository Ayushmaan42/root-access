import { useEffect, useRef } from 'react'
import { useGameStore } from '../../systems/StabilitySystem'

export default function DataRain() {
  const currentAct = useGameStore((state) => state.currentAct)
  const stabilityPercent = useGameStore((state) => state.stabilityPercent)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Active in Act 4 and Act 5
  const isRainActive = currentAct === 'act4' || currentAct === 'act5'

  useEffect(() => {
    if (!isRainActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fit canvas to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Characters list (binary, hex, debugger words)
    const chars = '01010101ABCDEF_DEBUG_ERR_CORE_VOID_ARCHITECT_SYS_FAIL'.split('')
    const fontSize = 14
    let columns = Math.floor(canvas.width / fontSize)
    
    // Y position drops per column
    let drops: number[] = Array(columns).fill(1)

    // Compute speed and density based on stability
    // Lower stability = faster fall speed
    const speedFactor = 1.0 + (100 - stabilityPercent) * 0.15 // scales up from 1 to 16
    let frameCount = 0

    // Set rain color palette
    const color = currentAct === 'act5' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(16, 185, 129, 0.22)' // Monochrome vs Green

    const draw = () => {
      frameCount++
      // Throttle rendering rate slightly for standard retro feel
      if (frameCount % 2 !== 0) return

      // Fade out slowly to leave trailing codes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = color
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = chars[Math.floor(Math.random() * chars.length)]
        
        // Draw character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        // Drop Y position
        drops[i] += (0.5 + Math.random() * 0.5) * (speedFactor * 0.4)

        // Reset drop to top of screen with randomized delay
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
      }
    }

    const interval = setInterval(draw, 30)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [isRainActive, currentAct, stabilityPercent])

  if (!isRainActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 opacity-70"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
