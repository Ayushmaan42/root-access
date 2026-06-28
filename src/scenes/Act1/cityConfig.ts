/**
 * Shared layout config + procedural generator for the Act 1 city.
 *
 * CityGrid, RoadNetwork and CyberpunkDetails all read from getLayout() so the
 * buildings, roads and rooftop props agree on the exact same positions.
 *
 * NOTE ON SCALE: the Kenney/Cyberpunk kits are all authored at a ~1-unit base
 * (a mid-rise building is ~1 wide, ~1.3 tall). With 20-unit blocks that would
 * be a near-empty lot, so each kit gets a world BASE scale below and the
 * prompt's "0.9–1.1" is applied as a per-instance variance multiplier on top.
 */

// ---- Asset roots (flattened — see CLAUDE.md asset table) ----
const B = '/assets/environment/Buildings/'
const R = '/assets/environment/Roads/'

const LETTERS14 = 'abcdefghijklmn'.split('') // a..n

export const SKYSCRAPER_URLS = ['a', 'b', 'c', 'd', 'e'].map(
  (x) => `${B}building-skyscraper-${x}.glb`
)
export const MIDRISE_URLS = LETTERS14.map((x) => `${B}building-${x}.glb`)
export const LOWDETAIL_URLS = [
  ...LETTERS14.map((x) => `${B}low-detail-building-${x}.glb`),
  `${B}low-detail-building-wide-a.glb`,
  `${B}low-detail-building-wide-b.glb`,
]

/** Every unique building GLB — used for useGLTF batch-load + preload. */
export const ALL_BUILDING_URLS = [
  ...SKYSCRAPER_URLS,
  ...MIDRISE_URLS,
  ...LOWDETAIL_URLS,
]

// ---- Road piece URLs ----
export const ROAD_URLS = {
  straight: `${R}road-straight.glb`,
  bend: `${R}road-bend.glb`,
  crossroad: `${R}road-crossroad.glb`,
  crossing: `${R}road-crossing.glb`,
  side: `${R}road-side.glb`,
  bendSidewalk: `${R}road-bend-sidewalk.glb`,
  lightSquare: `${R}light-square.glb`,
  lightSquareDouble: `${R}light-square-double.glb`,
}

// ---- Grid geometry ----
export const BLOCK_SIZE = 20
export const GRID = 8 // 8x8 blocks
export const CITY_HALF = (GRID / 2) * BLOCK_SIZE // 80 — half the road span

/** World X/Z of intersection line i (0..GRID): -80, -60, ... 80. */
export const linePos = (i: number) => (i - GRID / 2) * BLOCK_SIZE
/** World X/Z of block-center b (0..GRID-1): -70, -50, ... 70. */
export const blockCenter = (b: number) => (b - (GRID - 1) / 2) * BLOCK_SIZE

// ---- World scale calibration (base * variance) ----
export const BUILDING_SCALE = 6
export const SKYSCRAPER_SCALE = 7
export const LOWDETAIL_SCALE = 6
export const ROAD_TILE_WORLD = 5 // road tiles are ~1u, scaled x5 => 5u tiles
export const LIGHT_SCALE = 6

/** Allowed Y rotations (0/90/180/270) in radians. */
export const ROT_STEPS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

export interface Placement {
  url: string
  position: [number, number, number]
  rotationY: number
  scale: number
}

export interface CityLayout {
  buildings: Placement[]
  skyscrapers: Placement[]
  lowDetail: Placement[]
}

// ---- Seeded RNG (mulberry32) so the city is stable across renders ----
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function build(): CityLayout {
  const rng = mulberry32(13371337)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]
  const rot = () => ROT_STEPS[Math.floor(rng() * ROT_STEPS.length)]

  const buildings: Placement[] = []
  const skyscrapers: Placement[] = []
  const lowDetail: Placement[] = []

  // Mid-rise: 2–4 clustered per block, in jittered corner slots.
  const slots: Array<[number, number]> = [
    [-4, -4],
    [4, -4],
    [-4, 4],
    [4, 4],
  ]
  for (let bx = 0; bx < GRID; bx++) {
    for (let bz = 0; bz < GRID; bz++) {
      const cx = blockCenter(bx)
      const cz = blockCenter(bz)
      const order = [...slots].sort(() => rng() - 0.5)
      const count = 2 + Math.floor(rng() * 3) // 2..4
      for (let k = 0; k < count; k++) {
        const [ox, oz] = order[k]
        buildings.push({
          url: pick(MIDRISE_URLS),
          position: [
            cx + ox + (rng() - 0.5) * 2.4,
            0,
            cz + oz + (rng() - 0.5) * 2.4,
          ],
          rotationY: rot(),
          scale: BUILDING_SCALE * (0.9 + rng() * 0.2),
        })
      }
    }
  }

  // Skyscrapers: every 3rd intersection becomes a tower.
  let interIndex = 0
  for (let ix = 0; ix <= GRID; ix++) {
    for (let iz = 0; iz <= GRID; iz++) {
      if (interIndex++ % 3 === 0) {
        skyscrapers.push({
          url: pick(SKYSCRAPER_URLS),
          position: [linePos(ix), 0, linePos(iz)],
          rotationY: rot(),
          scale: SKYSCRAPER_SCALE * (0.9 + rng() * 0.2),
        })
      }
    }
  }

  // Outer ring of low-detail buildings for distant depth.
  for (let x = -126; x <= 126; x += 18) {
    for (let z = -126; z <= 126; z += 18) {
      const edge = Math.max(Math.abs(x), Math.abs(z))
      if (edge <= CITY_HALF + 6 || edge > 128) continue
      lowDetail.push({
        url: pick(LOWDETAIL_URLS),
        position: [x + (rng() - 0.5) * 8, 0, z + (rng() - 0.5) * 8],
        rotationY: rot(),
        scale: LOWDETAIL_SCALE * (0.8 + rng() * 0.5),
      })
    }
  }

  return { buildings, skyscrapers, lowDetail }
}

let cached: CityLayout | null = null
/** Stable, memoized city layout shared by every Act 1 component. */
export function getLayout(): CityLayout {
  if (!cached) cached = build()
  return cached
}
