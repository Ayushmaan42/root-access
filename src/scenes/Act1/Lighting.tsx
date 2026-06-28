import { Suspense, useMemo } from 'react'
import { Environment } from '@react-three/drei'
import { getLayout, linePos } from './cityConfig'

/**
 * Act 1 lighting: warm sun + cool sky ambient, a few sodium-orange street
 * lights, and a city HDRI for reflections. Tuned for performance — only 4
 * street lights + 2 beacons instead of 17 total.
 */
export default function Lighting() {
  // 4 warm streetlight glows at key intersections (down from 12).
  const streetLights = useMemo(() => {
    const pts: Array<[number, number, number]> = []
    for (const ix of [2, 6]) {
      for (const iz of [3, 5]) {
        pts.push([linePos(ix), 4, linePos(iz)])
      }
    }
    return pts
  }, [])

  // 2 beacons on the tallest skyscrapers (down from 5).
  const beacons = useMemo(() => {
    return getLayout()
      .skyscrapers.slice(0, 2)
      .map((s): [number, number, number] => [
        s.position[0],
        s.scale * 3.2,
        s.position[2],
      ])
  }, [])

  return (
    <>
      <directionalLight
        color="#fff5e0"
        intensity={2.5}
        position={[100, 80, 50]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.6}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <ambientLight color="#b0c8ff" intensity={0.6} />

      {streetLights.map((p, i) => (
        <pointLight
          key={`street-${i}`}
          position={p}
          color="#ff9944"
          intensity={1.5}
          distance={25}
          decay={2}
        />
      ))}

      {beacons.map((p, i) => (
        <pointLight
          key={`beacon-${i}`}
          position={p}
          color="#4488ff"
          intensity={2}
          distance={40}
          decay={2}
        />
      ))}

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
    </>
  )
}
