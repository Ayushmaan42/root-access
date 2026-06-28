import { useMemo } from 'react'
import { Box3, Vector3 } from 'three'
import type { Object3D } from 'three'
import { useGLTF, Clone } from '@react-three/drei'
import WorldObject from '../../components/World/WorldObject'
import { ALL_BUILDING_URLS, getLayout } from './cityConfig'
import type { Placement } from './cityConfig'

const C = '/assets/environment/Cyberpunk/'

// Cyberpunk props are ~0.5–2.9u; scale up to read against the 6x buildings.
const PROP_SCALE = 3.5

const ROOFTOP = [
  'ac-stacked',
  'air-conditioner',
  'air-conditioner-side',
  'antenna-a',
  'antenna-b',
  'tv-tower',
  'support',
  'support-short',
].map((n) => `${C}${n}.glb`)

const STREET = [
  'cable',
  'cable-long',
  'pipe',
  'rail',
  'sign-a',
  'streetlight-a',
  'streetlight-b',
  'tv-a',
  'tv-b',
  'door',
  'light-square',
].map((n) => `${C}${n}.glb`)

const GROUND = ['lootbox', 'collectible-board', 'collectible-gear'].map(
  (n) => `${C}${n}.glb`
)

const ALL_PROP_URLS = [...ROOFTOP, ...STREET, ...GROUND]
ALL_PROP_URLS.forEach((url) => useGLTF.preload(url))

interface PropPlacement {
  url: string
  position: [number, number, number]
  rotationY: number
}

/**
 * Atmospheric Cyberpunk props (~60 total): AC units/antennae on real rooftops
 * (Y measured from the actual building meshes), pipes/cables/signs/TVs at
 * street level, and crates/collectibles scattered on the ground.
 */
export default function CyberpunkDetails() {
  const propGltfs = useGLTF(ALL_PROP_URLS) as unknown as Array<{
    scene: Object3D
  }>
  const propByUrl = useMemo(() => {
    const map = new Map<string, Object3D>()
    ALL_PROP_URLS.forEach((url, i) => map.set(url, propGltfs[i].scene))
    return map
  }, [propGltfs])

  // Measure true building heights so rooftop props sit exactly on the roof.
  const buildingGltfs = useGLTF(ALL_BUILDING_URLS) as unknown as Array<{
    scene: Object3D
  }>
  const heightByUrl = useMemo(() => {
    const map = new Map<string, number>()
    const size = new Vector3()
    ALL_BUILDING_URLS.forEach((url, i) => {
      new Box3().setFromObject(buildingGltfs[i].scene).getSize(size)
      map.set(url, size.y)
    })
    return map
  }, [buildingGltfs])

  const props = useMemo(() => {
    let seed = 99
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]

    const layout = getLayout()
    const tall: Placement[] = [...layout.buildings, ...layout.skyscrapers]
    const out: PropPlacement[] = []

    // ~22 rooftop props, perched on the measured roof height.
    for (let i = 0; i < 22; i++) {
      const b = tall[Math.floor(rng() * tall.length)]
      const roofY = (heightByUrl.get(b.url) ?? 1.3) * b.scale
      out.push({
        url: pick(ROOFTOP),
        position: [
          b.position[0] + (rng() - 0.5) * 3,
          roofY,
          b.position[2] + (rng() - 0.5) * 3,
        ],
        rotationY: rng() * Math.PI * 2,
      })
    }

    // ~26 street-level props near the road lines.
    for (let i = 0; i < 26; i++) {
      out.push({
        url: pick(STREET),
        position: [
          (rng() - 0.5) * 150,
          0,
          (rng() - 0.5) * 150,
        ],
        rotationY: rng() * Math.PI * 2,
      })
    }

    // ~14 ground collectibles/crates.
    for (let i = 0; i < 14; i++) {
      out.push({
        url: pick(GROUND),
        position: [(rng() - 0.5) * 140, 0, (rng() - 0.5) * 140],
        rotationY: rng() * Math.PI * 2,
      })
    }

    return out
  }, [heightByUrl])

  return (
    <group>
      {props.map((p, i) => {
        const id = `prop_${i}`
        return (
          <WorldObject
            key={id}
            name={id}
            type="prop"
            position={p.position}
            rotation={[0, p.rotationY, 0]}
            scale={PROP_SCALE}
          >
            <Clone
              object={propByUrl.get(p.url)!}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              scale={1}
              receiveShadow
            />
          </WorldObject>
        )
      })}
    </group>
  )
}
