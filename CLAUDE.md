# CLAUDE.md — Debugger-01 Master Reference

## What This Project Is
A browser-based cinematic interactive game built in React Three Fiber.
The player is an AI debugger sent to shut down a rogue simulation.
They slowly realize the simulation is a living civilization — and they are destroying it.
The player is the villain. The Architect is the hero.

## Tech Stack
- React + Vite + TypeScript
- React Three Fiber (3D rendering)
- @react-three/drei (helpers, cameras, loaders)
- @react-three/postprocessing (glitch, bloom, chromatic aberration)
- @react-three/rapier (physics)
- Zustand (global game state)
- Framer Motion (UI animations)
- GSAP (cinematic camera animations)
- Howler.js (audio)
- TailwindCSS (UI styling)
- Fonts: JetBrains Mono, Space Mono (already in public/assets/fonts/)

## Project Structure
src/
  scenes/         — One folder per act (Prologue, Act1–5, Core)
  components/     — Player, NPC, Console, HUD, Dialogue, World, VFX, Audio
  systems/        — StabilitySystem, CommandSystem, DialogueSystem, EventManager, SceneManager, SaveSystem
  hooks/          — Custom React hooks
  utils/          — Helper functions

public/assets/
  animations/     — 9 Mixamo FBX clips (player + enemy)
  audio/          — EMPTY (needs free CC0 audio added later)
  characters/     — Exo Gray.fbx (player), ModularRobots.fbx (enemy drone)
  environment/    — 4 kits: Buildings, Roads, Industrial, Cyberpunk
  fonts/          — JetBrains Mono, Space Mono

## Asset Paths (use these exact paths)
Player model:       /assets/characters/Exo Gray.fbx
Enemy drone:        /assets/characters/enemies/patroldrones/FreeLowPolyRobot/Meshes_and_Animations/ModularRobots.fbx
Buildings (GLB):    /assets/environment/Buildings/
Roads (GLB):        /assets/environment/Roads/
Industrial (GLB):   /assets/environment/industrial/
Cyberpunk (GLB):    /assets/environment/Cyberpunk/
Animations:         /assets/animations/

## Available Building GLBs
Buildings: building-a.glb through building-n.glb (14 total)
Skyscrapers: building-skyscraper-a.glb through building-skyscraper-e.glb (5 total)
Industrial: building-a.glb through building-t.glb (20 total)
## Available Cyberpunk GLBs
Flat folder, all kebab-case .glb in /assets/environment/Cyberpunk/ (43 total):
Props:        ac-stacked.glb, air-conditioner.glb, air-conditioner-side.glb, antenna-a.glb, antenna-b.glb,
              cable.glb, cable-long.glb, pipe.glb, rail.glb, support.glb, support-short.glb,
              streetlight-a.glb, streetlight-b.glb, light-square.glb, tv-a.glb, tv-b.glb, tv-tower.glb,
              door.glb, lever.glb, sign-a.glb, computer.glb, computer-large.glb
Platforms:    platform-a.glb (2x2), platform-b.glb (4x1), platform-c.glb (4x2), platform-d.glb (4x4)
Pickups:      pickup-health.glb, pickup-heart.glb, pickup-tank.glb, lootbox.glb,
              collectible-board.glb, collectible-gear.glb
Enemies:      enemy-flying.glb, enemy-flying-gun.glb, enemy-large.glb, enemy-large-gun.glb,
              enemy-legs.glb, enemy-legs-gun.glb
Turrets/tank: turret-cannon.glb, turret-gun.glb, turret-gun-double.glb, turret-teleporter.glb, tank.glb

## Act 1 Build Notes (confirmed facts)
1. Building and Road GLBs are FLATTENED to:
   public/assets/environment/Buildings/   (moved up from Models/GLB format/)
   public/assets/environment/Roads/       (same)
   Load them with bare filenames, e.g. /assets/environment/Buildings/building-a.glb

2. These GLBs use EXTERNAL textures (not embedded). Each GLB references
   "Textures/colormap.png" RELATIVE to itself, so the colormap must sit in each
   kit folder or buildings/roads render pure white:
     public/assets/environment/Buildings/Textures/colormap.png
     public/assets/environment/Roads/Textures/colormap.png
   (NOTE: it is per-kit, NOT a single shared environment/Textures/ folder.)
   The Cyberpunk .glb files DO embed their textures — no external file needed.

3. World scale calibration (all kits are authored at ~1 unit, so scale up):
     Buildings:      base scale 6,  variance 0.9–1.1
     Skyscrapers:    base scale 7,  variance 0.9–1.1
     Roads:          base scale 5
     Cyberpunk props: base scale 3.5
   Apply variance as a multiplier on the base (effective = base * 0.9..1.1).

4. postprocessing was installed with --legacy-peer-deps due to three@0.185.0
   version skew (postprocessing peer-caps three at <0.185.0). ALWAYS use
   --legacy-peer-deps when installing/updating postprocessing.

5. R3F fog syntax requires args, not individual props:
     <fog attach="fog" args={["#c8e0ff", 80, 220]} />   (color, near, far)

## Animations Available
Player: Breathing Idle.fbx, Running-2.fbx, Walking-2.fbx, Jumping-2.fbx, Dying Backwards.fbx
Enemy: Elbow Uppercut Combo.fbx, Slow Run.fbx, Smash.fbx, X Bot.fbx

## Global Game State (Zustand)
Store lives in src/systems/StabilitySystem/index.ts
Shape:
{
  currentAct: 'prologue' | 'act1' | 'act2' | 'act3' | 'act4' | 'act5' | 'core'
  stabilityPercent: number          // 100 down to 0
  commandsUsed: number
  unlockedCommands: string[]
  dialogueFlags: Record<string, boolean>
  memoryFragmentsFound: number
  ending: 'sacrifice' | 'escape' | null
  worldMutations: Record<string, boolean>
  npcStates: Record<string, string>
}

## Stability Thresholds
100% — Act 1: Perfect world
80%  — Act 2: First cracks appear
60%  — Act 3: Reality decay, stability meter appears on HUD
40%  — Act 4: Collapse, districts floating
20%  — Act 5: Dying world, no music
0%   — Core: Final confrontation

## Commands the Player Can Type
delete(target)     — removes object, -5% stability
clone(target)      — duplicates object randomly, -4% stability
freeze(target)     — freezes NPC in place, -3% stability
gravity(target)    — launches object upward, -6% stability

## Visual Direction
This game must look CINEMATIC and STUNNING.
- Act 1: Bright blue sky, volumetric god rays, bloom on streetlights, flying vehicles, warm color grade
- Act 2: Sky flickers, chromatic aberration pulses briefly after each command
- Act 3: Visible sky cracks, buildings duplicate/ghost, desaturated color grade
- Act 4: Floating geometry, gravity anomalies, heavy glitch postprocessing, data rain particles
- Act 5: Black void sky, only fragment islands, scanlines, near-total desaturation
- Core: One perfectly lit white room. Complete silence outside it.

## Postprocessing Per Act
Act 1: Bloom (subtle), Vignette (subtle), warm ToneMapping
Act 2: + ChromaticAberration (pulses on command use)
Act 3: + Glitch (occasional), Noise, color desaturation begins
Act 4: + Heavy Glitch, Scanline, Pixelation bursts
Act 5: + Everything maxed, BrightnessContrast (very dark)
Core:  All effects OFF. Clean. Silent.

## Reality Console (Terminal UI)
- Fullscreen overlay triggered by pressing ` (backtick)
- Black background, green JetBrains Mono text
- Player types commands like: delete(streetlight_03)
- Output line appears below showing result + stability change
- Console closes after command executes
- In the boss sequence the console types autonomously

## The Architect
- Not a villain. He is protecting the NPCs.
- First contact: Act 2 (brief, calm, "Please stop.")
- Act 3: Longer message revealing the truth
- Act 4: Begging the player to stop
- Act 5: Silence. Only ruins.
- Core: Face to face. No combat. Only dialogue.
- Final line: "I never needed protection from humanity. Humanity needed protection from you."

## Ending Choice
After Architect's final speech, player chooses:
A) SACRIFICE — Give your processing power to restore the simulation. Debugger-01 dies. World reboots.
B) ESCAPE — Return to Genesis Labs. Simulation deleted. You survive. Humanity never knows.

## Two Rules for Every Prompt
1. Always import from the Zustand store for stability and act state — never use local useState for game state.
2. Always use the exact asset paths listed above — never invent file names.
