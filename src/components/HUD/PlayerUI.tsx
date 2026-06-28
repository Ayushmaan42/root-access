import React, { useEffect, useState } from 'react'
import { useGameStore } from '../../systems/StabilitySystem'

export default function PlayerUI() {
  const playerHealth = useGameStore((s) => s.playerHealth)
  const [showDamageFlash, setShowDamageFlash] = useState(false)
  const [prevHealth, setPrevHealth] = useState(playerHealth)

  useEffect(() => {
    if (playerHealth < prevHealth) {
      setShowDamageFlash(true)
      const t = setTimeout(() => setShowDamageFlash(false), 300)
      setPrevHealth(playerHealth)
      return () => clearTimeout(t)
    } else if (playerHealth > prevHealth) {
      setPrevHealth(playerHealth)
    }
  }, [playerHealth, prevHealth])

  return (
    <>
      {/* Damage overlay */}
      {showDamageFlash && (
        <div className="fixed inset-0 bg-red-600/20 z-10 pointer-events-none transition-opacity duration-300" />
      )}
      
      <div className="fixed bottom-8 left-8 w-64 z-40 bg-black/80 border border-emerald-500/50 p-4 font-mono shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-sm">
        <div className="uppercase tracking-widest text-xs border-b border-emerald-900 pb-2 mb-3 text-emerald-400 flex justify-between">
          <span>SYSTEM INTEGRITY</span>
          <span className={playerHealth < 40 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}>
            {playerHealth}%
          </span>
        </div>

        <div className="w-full h-3 bg-emerald-950 border border-emerald-800">
          <div 
            className={`h-full transition-all duration-300 ${playerHealth < 40 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`}
            style={{ width: `${playerHealth}%` }}
          />
        </div>
        
        {playerHealth < 40 && (
          <div className="mt-2 text-[10px] text-red-500 animate-pulse uppercase tracking-widest">
            WARNING: CRITICAL DAMAGE
          </div>
        )}
      </div>
    </>
  )
}
