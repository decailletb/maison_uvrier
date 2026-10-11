/** Box, rounded box and cylinder geometries with metric UVs (see `metricUVs`), in metres. */
import { useEffect, useMemo } from "react";
import { BoxGeometry, CylinderGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { metricUVs } from "../uv";

export type GeometryShape = "box" | "rounded" | "cylinder";

export function MetricGeometry({ size, shape = "box" }: { size: readonly [number, number, number]; shape?: GeometryShape }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => {
    if (shape === "rounded") return metricUVs(new RoundedBoxGeometry(w, h, d, 3, Math.min(0.06, Math.min(w, h, d) * 0.3)));
    if (shape === "cylinder") {
      // Elliptic footprint: radius on x, stretched along z.
      const g = new CylinderGeometry(w / 2, w / 2, h, 32);
      g.scale(1, 1, d / w);
      return metricUVs(g);
    }
    return metricUVs(new BoxGeometry(w, h, d));
  }, [w, h, d, shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <primitive object={geometry} attach="geometry" />;
}
