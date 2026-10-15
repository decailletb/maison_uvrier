/**
 * Post-processing for the "réaliste" quality: N8AO ambient occlusion (contact shadows in
 * corners, under furniture and along skirting), a soft bloom for the lit lamps, SMAA
 * edges, then the Khronos Neutral tone mapping that the renderer applies otherwise.
 */
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useDisplay } from "./display";

export function Effects() {
  const quality = useDisplay((s) => s.quality);
  const lightsOn = useDisplay((s) => s.lightsOn);
  if (quality === "low") return null;
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.5} distanceFalloff={0.6} intensity={2.2} halfRes quality="medium" />
      <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={lightsOn ? 0.6 : 0.2} mipmapBlur />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
