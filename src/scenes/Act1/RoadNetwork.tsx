import { useMemo } from 'react'
import { Mesh } from 'three'
import type { Object3D, BufferGeometry, Material } from 'three'
import { useGLTF, Clone, Instances, Instance } from '@react-three/drei'
import WorldObject from '../../components/World/WorldObject'
import {
  ROAD_URLS,
  ROAD_TILE_WORLD,
  LIGHT_SCALE,
  CITY_HALF,
  GRID,
  linePos,
  getLayout,
} from './cityConfig'

const ROAD_PATHS = Object.values(ROAD_URLS)
ROAD_PATHS.forEach((url) => useGLTF.preload(url))

const SKY_SKIP = 7 // keep road tiles out from under skyscraper plazas
const HALF_PI = Math.PI / 2

interface Tile {
  url: string
  position: [number, number, number]
  rotationY: number
  scale: [number, number, number]
}

/**
 * Grid of road tiles laid along every block line, with crossroads at
 * intersections (skipped under skyscrapers), occasional pedestrian crossings,
 * a sidewalk border, and street-lamp models down the main avenues.
 */
export default function RoadNetwork() {
  const gltfs = useGLTF(ROAD_PATHS) as unknown as Array<{ scene: Object3D }>
  const sceneByUrl = useMemo(() => {
    const map = new Map<string, Object3D>()
    ROAD_PATHS.forEach((url, i) => map.set(url, gltfs[i].scene))
    return map
  }, [gltfs])

  const { tiles, lamps } = useMemo(() => {
    const skyCenters = getLayout().skyscrapers.map((s) => ({
      x: s.position[0],
      z: s.position[2],
    }))
    const nearSky = (x: number, z: number) =>
      skyCenters.some(
        (c) => Math.abs(c.x - x) < SKY_SKIP && Math.abs(c.z - z) < SKY_SKIP
      )

    const t: Tile[] = []
    const l: Tile[] = []
    const s = ROAD_TILE_WORLD
    const baseScale: [number, number, number] = [s, s, s]
    const isInter = (v: number) => Math.abs(v % BLOCK) < 0.01
    const BLOCK = 20

    // Continuous unit tiles every ROAD_TILE_WORLD along each grid line.
    const coords: number[] = []
    for (let c = -CITY_HALF; c <= CITY_HALF + 0.01; c += s) coords.push(c)

    // Pseudo-random but stable crossing sprinkle.
    let seed = 7
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }

    for (let i = 0; i <= GRID; i++) {
      const line = linePos(i)
      for (const c of coords) {
        // X-direction line (road runs along X), at z = line.
        if (!isInter(c) && !nearSky(c, line)) {
          t.push({
            url: rng() < 0.12 ? ROAD_URLS.crossing : ROAD_URLS.straight,
            position: [c, 0.02, line],
            rotationY: 0,
            scale: baseScale,
          })
        }
        // Z-direction line (road runs along Z), at x = line.
        if (!isInter(c) && !nearSky(line, c)) {
          t.push({
            url: rng() < 0.12 ? ROAD_URLS.crossing : ROAD_URLS.straight,
            position: [line, 0.02, c],
            rotationY: HALF_PI,
            scale: baseScale,
          })
        }
      }
    }

    // Crossroads at every intersection (unless a skyscraper plaza sits there).
    for (let ix = 0; ix <= GRID; ix++) {
      for (let iz = 0; iz <= GRID; iz++) {
        const x = linePos(ix)
        const z = linePos(iz)
        if (nearSky(x, z)) continue
        t.push({
          url: ROAD_URLS.crossroad,
          position: [x, 0.02, z],
          rotationY: 0,
          scale: baseScale,
        })
      }
    }

    // Sidewalk border + corner pieces just outside the outermost lines.
    const outer = CITY_HALF + s
    for (const sign of [-1, 1]) {
      for (const c of coords) {
        l.push({
          url: ROAD_URLS.side,
          position: [c, 0.02, sign * outer],
          rotationY: 0,
          scale: baseScale,
        })
        l.push({
          url: ROAD_URLS.side,
          position: [sign * outer, 0.02, c],
          rotationY: HALF_PI,
          scale: baseScale,
        })
      }
    }
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        l.push({
          url: ROAD_URLS.bendSidewalk,
          position: [sx * outer, 0.02, sz * outer],
          rotationY: 0,
          scale: baseScale,
        })
      }
    }

    // Street lamps every 10u down the main avenues (every other line),
    // offset to the kerb so they flank the road.
    const lampOffset = s / 2 + 1.5
    for (let i = 0; i <= GRID; i += 2) {
      const line = linePos(i)
      for (let c = -CITY_HALF; c <= CITY_HALF; c += 10) {
        if (nearSky(c, line)) continue
        l.push({
          url: ROAD_URLS.lightSquare,
          position: [c, 0, line + lampOffset],
          rotationY: Math.PI,
          scale: [LIGHT_SCALE, LIGHT_SCALE, LIGHT_SCALE],
        })
      }
    }
    // A double lamp at each skyscraper plaza for a bit of grandeur.
    for (const c of skyCenters) {
      l.push({
        url: ROAD_URLS.lightSquareDouble,
        position: [c.x, 0, c.z],
        rotationY: 0,
        scale: [LIGHT_SCALE, LIGHT_SCALE, LIGHT_SCALE],
      })
    }

    return { tiles: t, lamps: l }
  }, [])

  // GPU-instance the road tiles: group by GLB, bake each model's geometry, and
  // draw all tiles of a type in ONE call. ~600 Clones => ~3 draw calls.
  const roadGroups = useMemo(() => {
    const byUrl = new Map<string, Tile[]>()
    for (const tile of tiles) {
      const list = byUrl.get(tile.url)
      if (list) list.push(tile)
      else byUrl.set(tile.url, [tile])
    }

    const groups: Array<{
      url: string
      geometry: BufferGeometry
      material: Material
      items: Tile[]
    }> = []

    byUrl.forEach((items, url) => {
      const scene = sceneByUrl.get(url)
      if (!scene) return
      scene.updateWorldMatrix(true, true)
      let mesh: Mesh | undefined
      scene.traverse((o) => {
        if (!mesh && o instanceof Mesh) mesh = o
      })
      if (!mesh) return
      const geometry = mesh.geometry.clone()
      geometry.applyMatrix4(mesh.matrixWorld) // bake the GLB's own transform
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      groups.push({ url, geometry, material, items })
    })
    return groups
  }, [tiles, sceneByUrl])

  const renderRoads = () =>
    roadGroups.map((g) => (
      <Instances
        key={g.url}
        geometry={g.geometry}
        material={g.material}
        limit={g.items.length}
        receiveShadow
      >
        {g.items.map((tile, i) => (
          <Instance
            key={i}
            position={tile.position}
            rotation={[0, tile.rotationY, 0]}
            scale={tile.scale}
          />
        ))}
      </Instances>
    ))

  const renderLamps = (arr: Tile[]) =>
    arr.map((tile, i) => {
      const id = `streetlight_${i}`
      return (
        <WorldObject
          key={id}
          name={id}
          type="lamp"
          position={tile.position}
          rotation={[0, tile.rotationY, 0]}
          scale={tile.scale}
        >
          <Clone
            object={sceneByUrl.get(tile.url)!}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
            receiveShadow
          />
        </WorldObject>
      )
    })

  return (
    <group>
      {renderRoads()}
      {renderLamps(lamps)}
    </group>
  )
}
