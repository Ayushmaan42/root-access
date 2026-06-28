import React from 'react'
import { useGameStore } from '../../systems/StabilitySystem'

export default function MissionUI() {
  const currentObjective = useGameStore((s) => s.currentObjective)
  const currentTasks = useGameStore((s) => s.currentTasks)

  return (
    <div className="fixed top-8 right-8 w-80 bg-black/80 border border-emerald-500/50 p-4 text-emerald-400 font-mono flex flex-col gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] z-40 backdrop-blur-sm">
      <div className="uppercase tracking-widest text-xs border-b border-emerald-900 pb-2 flex justify-between">
        <span>CURRENT DIRECTIVE</span>
        <span className="text-emerald-600 animate-pulse">REC</span>
      </div>
      
      <div className="font-bold text-lg text-emerald-300">
        {currentObjective}
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {currentTasks.map((task) => (
          <div key={task.id} className={`flex items-start gap-3 text-sm ${task.completed ? 'opacity-50' : ''}`}>
            <div className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 ${task.completed ? 'border-emerald-700 bg-emerald-900/50' : 'border-emerald-500'}`}>
              {task.completed && <span className="text-emerald-500 text-xs">✓</span>}
            </div>
            <span className={`${task.completed ? 'line-through text-emerald-700' : 'text-emerald-400'}`}>
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
