import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * Act 1 post: gentle bloom on the bright surfaces, a soft vignette, and
 * filmic tone mapping for a warm, cinematic grade. No glitch, no chromatic
 * aberration — the world is still perfect here.
 */
export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.4} intensity={1.5} mipmapBlur />
      <Vignette darkness={0.65} offset={0.1} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
