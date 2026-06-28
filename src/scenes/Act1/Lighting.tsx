import { Suspense, useMemo } from 'react'
import { Environment } from '@react-three/drei'
import { getLayout, linePos } from './cityConfig'

/**
 * Act 1 lighting: intense dark night scene. Dim moonlight, dark ambient,
 * high-intensity sodium streetlights, and a dark 'night' HDRI.
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
        color="#3b5588"
        intensity={0.4}
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
      <ambientLight color="#050815" intensity={0.2} />

      {streetLights.map((p, i) => (
        <pointLight
          key={`street-${i}`}
          position={p}
          color="#ff7711"
          intensity={3.5}
          distance={35}
          decay={2}
        />
      ))}

      {beacons.map((p, i) => (
        <pointLight
          key={`beacon-${i}`}
          position={p}
          color="#1166ff"
          intensity={5}
          distance={50}
          decay={2}
        />
      ))}

      <Suspense fallback={null}>
        <Environment preset="night" environmentIntensity={0.2} />
      </Suspense>
    </>
  )
}
