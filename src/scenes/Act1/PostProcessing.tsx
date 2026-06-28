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
      <Bloom luminanceThreshold={0.6} intensity={0.8} mipmapBlur />
      <Vignette darkness={0.5} offset={0.3} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
