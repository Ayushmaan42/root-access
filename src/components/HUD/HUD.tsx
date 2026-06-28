import { useGameStore } from '../../systems/StabilitySystem'
import StabilityMeter from './StabilityMeter'
import DialogueOverlay from './DialogueOverlay'

export default function HUD() {
  const currentAct = useGameStore((state) => state.currentAct)
  const stabilityPercent = useGameStore((state) => state.stabilityPercent)
  const activeTarget = useGameStore((state) => state.activeTarget)
  const unlockedCommands = useGameStore((state) => state.unlockedCommands)

  // Don't render general HUD in prologue or core confrontation scenes
  const isMinimalHUD = currentAct === 'prologue' || currentAct === 'core'

  // Map acts to human readable names
  const actNames = {
    prologue: 'SYSTEM BOOT',
    act1: 'SECTOR A: INTEGRITY_NORMAL',
    act2: 'SECTOR A: INTEGRITY_FLICKER',
    act3: 'SECTOR A: INTEGRITY_DECAY',
    act4: 'SECTOR A: COLLAPSE_WARNING',
    act5: 'SECTOR A: FAILING_GRID',
    core: 'SYSTEM CORE CONFRONTATION',
  }

  return (
    <>
      {/* Dialogue and Stability overlay layers */}
      <DialogueOverlay />
      <StabilityMeter />

      {!isMinimalHUD && (
        <div className="fixed inset-0 pointer-events-none z-30 font-mono text-emerald-500 text-xs">
          
          {/* Top-Left Debugger Panel */}
          <div className="absolute top-6 left-6 p-4 border border-emerald-950 bg-black/75 backdrop-blur-sm rounded w-80">
            <div className="flex justify-between items-center text-[10px] text-emerald-700 border-b border-emerald-950 pb-1 mb-2 font-bold tracking-widest uppercase">
              <span>DEBUGGER ONLINE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="space-y-1">
              <div>ACT: <span className="text-white">{actNames[currentAct]}</span></div>
              <div>MAIN CORE: <span className="text-white">GENESIS_GRID_LINK</span></div>
              <div>STABILITY: <span className="text-white">{stabilityPercent}%</span></div>
            </div>
          </div>

          {/* Bottom-Left Command Database Panel */}
          <div className="absolute bottom-6 left-6 p-4 border border-emerald-950 bg-black/75 backdrop-blur-sm rounded w-80">
            <div className="text-[10px] text-emerald-700 border-b border-[#134e4a] pb-1 mb-2 font-bold tracking-widest uppercase">
              DECOMPILER_DATABASE
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span>delete(target)</span>
                <span className="text-emerald-400 font-bold">[ACTIVE]</span>
              </div>
              <div className="flex justify-between">
                <span>clone(target)</span>
                <span className={unlockedCommands.includes('clone') ? 'text-cyan-400 font-bold' : 'text-gray-600'}>
                  {unlockedCommands.includes('clone') ? '[UNLOCKED]' : '[LOCKED: ACT 2]'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>freeze(target)</span>
                <span className={unlockedCommands.includes('freeze') ? 'text-cyan-400 font-bold' : 'text-gray-600'}>
                  {unlockedCommands.includes('freeze') ? '[UNLOCKED]' : '[LOCKED: ACT 3]'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>gravity(target)</span>
                <span className={unlockedCommands.includes('gravity') ? 'text-cyan-400 font-bold' : 'text-gray-600'}>
                  {unlockedCommands.includes('gravity') ? '[UNLOCKED]' : '[LOCKED: ACT 4]'}
                </span>
              </div>
            </div>
          </div>

          {/* Center Targeting HUD HUD reticle details */}
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* Center screen crosshair */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {/* Spinning circular reticle bounds */}
              <div className={`absolute inset-0 border border-dashed rounded-full animate-[spin_20s_linear_infinite] ${
                activeTarget ? 'border-cyan-400 scale-125' : 'border-emerald-800'
              }`} />
            </div>

            {/* Target locking description panel (floats to the right of crosshair) */}

          </div>
        </div>
      )}
    </>
  )
}
