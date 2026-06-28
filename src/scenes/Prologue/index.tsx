import { useEffect, useState } from 'react'
import { useGameStore } from '../../systems/StabilitySystem'
import { playSynthBeep, playSuccessSound } from '../../utils/sound'

interface BootLog {
  text: string
  color: string
}

export default function PrologueScene() {
  const currentAct = useGameStore((state) => state.currentAct)
  const [logs, setLogs] = useState<BootLog[]>([])
  const [bootPhase, setBootPhase] = useState(0) // 0: loading, 1: directive, 2: ready to connect

  // Sound effects on step boot
  useEffect(() => {
    if (currentAct !== 'prologue') return

    const bootSequence: { text: string; delay: number; color?: string }[] = [
      { text: 'DEBUGGER-01 // BOOT ROUTINE', delay: 200, color: 'text-emerald-400 font-bold' },
      { text: 'LOADING STABILITY ENGINE........ [OK]', delay: 400 },
      { text: 'CONNECTING CORE REGISTER........ [OK]', delay: 600 },
      { text: 'VERIFYING FILE HASH DECAY....... [OK]', delay: 800 },
      { text: 'LOCATING TARGET FILE: ARC_902... [FOUND]', delay: 1100, color: 'text-cyan-400' },
      { text: 'LINK ESTABLISHED. BUFFER NORMAL.', delay: 1400 },
      { text: '---------------------------------------------------', delay: 1600, color: 'text-[#065f46]' },
      { text: '[GENESIS SYSTEMS]: LINK SECURED.', delay: 1800, color: 'text-emerald-500 font-semibold' },
    ]

    bootSequence.forEach((item, idx) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, { text: item.text, color: item.color || 'text-zinc-500' }])
        playSynthBeep(600 + idx * 50, 0.04, 'sine')
      }, item.delay)
    })

    // Advance to directive phase
    setTimeout(() => {
      setBootPhase(1)
      playSynthBeep(800, 0.1, 'triangle')
    }, 2200)
  }, [currentAct])

  // Key press listener to connect to Act 1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (bootPhase === 2 && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        playSuccessSound()
        // Initialize stability store
        useGameStore.setState({ currentAct: 'act1' })
        
        // Load initial act 1 dialogue
        setTimeout(() => {
          const act1Dialog = [
            '[SYSTEM]: DEBUGGER-01 PROTOCOL INITIALIZED.',
            '[SYSTEM]: ESTABLISHING GRID LINK... STABILITY 100%.',
            '[SYSTEM]: MISSION BRIEF: PURGE DEVIANT CODE DIRECTORY: "THE ARCHITECT".',
            '[SYSTEM]: COMMAND INTERFACE ENGAGED. PRESS Q TO INITIATE HACK OVERRIDES.'
          ]
          useGameStore.getState().showDialogue(act1Dialog)
        }, 1200)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bootPhase])

  return (
    <div
      className="fixed inset-0 bg-[#000402] text-zinc-300 font-mono p-12 overflow-y-auto flex flex-col justify-between selection:bg-emerald-950 select-none"
      style={{
        backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.05) 50%, rgba(0, 0, 0, 0.15) 50%)',
        backgroundSize: '100% 4px',
      }}
    >
      {/* Top diagnostic header */}
      <div className="flex justify-between border-b border-[#0f766e]/30 pb-4 text-xs text-zinc-600 tracking-wider">
        <span>GENESIS CORE V2.14 // HOST_ROOT</span>
        <span>SECTOR LINK: ESTABLISHED</span>
      </div>

      {/* Main logging terminal view */}
      <div className="flex-1 my-8 max-w-4xl space-y-2 text-sm">
        {logs.map((log, idx) => (
          <div key={idx} className={log.color}>
            {log.text}
          </div>
        ))}

        {/* Directive details */}
        {bootPhase >= 1 && (
          <div className="mt-8 border border-emerald-950 bg-emerald-950/5 p-6 rounded animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-sm font-bold text-emerald-400 mb-4 tracking-widest uppercase">
              GENESIS DIRECTIVE // INTRUSION_LOG
            </h2>
            <div className="space-y-3 leading-relaxed text-emerald-600 text-xs">
              <p>
                <span className="text-white font-bold">SOURCE:</span> Genesis Systems Management Core.
              </p>
              <p>
                <span className="text-white font-bold">MISSION OBJECTIVE:</span> Purge the rogue memory segment
                known as &quot;The Architect&quot; (ID: <span className="text-cyan-400 font-bold">ARC_902</span>) that
                has locked simulation sectors and achieved localized self-governance.
              </p>
              <p>
                <span className="text-white font-bold">EXECUTION METHOD:</span> Connect to the grid. Use debugger
                overrides: <span className="text-cyan-500 font-bold">delete()</span>,{' '}
                <span className="text-cyan-500 font-bold">clone()</span>,{' '}
                <span className="text-cyan-500 font-bold">freeze()</span>, and{' '}
                <span className="text-cyan-500 font-bold">gravity()</span>.
              </p>
              <p className="text-[#059669] italic">
                WARNING: Decompiling active simulation memory nodes will destabilize simulation integrity.
                Destabilization is required to bypass security grids and flush out the Architect core.
              </p>
            </div>

            {/* Prompt connect button delay */}
            {bootPhase === 1 && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setBootPhase(2)
                    playSynthBeep(1000, 0.08, 'sine')
                  }}
                  className="px-4 py-2 border border-emerald-500 text-emerald-400 hover:bg-emerald-950/20 active:scale-95 transition-all text-xs tracking-widest cursor-pointer"
                >
                  INITIALIZE CONNECT PROTOCOL
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ready phase keypress listener */}
        {bootPhase === 2 && (
          <div className="mt-8 text-center text-xs tracking-widest text-[#34d399] animate-pulse py-4 border-t border-dashed border-[#115e59]/30">
            CONNECTING INTERFACE... PRESS [ SPACE / ENTER ] TO LOG IN
          </div>
        )}
      </div>

      {/* Footer credits */}
      <div className="border-t border-[#0f766e]/30 pt-4 flex justify-between text-[10px] text-zinc-700">
        <div>GENESIS LABS © 2026 // ALL RIGHTS RESERVED</div>
        <div>DEBUGGER-01 PROTOCOL V1.0</div>
      </div>
    </div>
  )
}
