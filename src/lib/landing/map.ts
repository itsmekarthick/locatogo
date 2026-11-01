import { WORLD_DOTS } from "./world-dots";

/** One degree is two SVG units, so the dot map keeps true proportions. */
export const MAP_SCALE = 2;
export const MAP_W = (WORLD_DOTS.lngMax - WORLD_DOTS.lngMin) * MAP_SCALE;
export const MAP_H = (WORLD_DOTS.latMax - WORLD_DOTS.latMin) * MAP_SCALE;

export function projectToMap(lat: number, lng: number) {
  return { x: (lng - WORLD_DOTS.lngMin) * MAP_SCALE, y: (WORLD_DOTS.latMax - lat) * MAP_SCALE };
}

const GAP = WORLD_DOTS.step * MAP_SCALE;

/** One horizontal run per path segment; a zero length dash with round caps draws a dot every GAP units. */
export const WORLD_DOTS_PATH = (() => {
  const parts: string[] = [];
  for (let index = 0; index < WORLD_DOTS.runs.length; index += 3) {
    const row = WORLD_DOTS.runs[index];
    const column = WORLD_DOTS.runs[index + 1];
    const length = WORLD_DOTS.runs[index + 2];
    const x = (column + 0.5) * GAP;
    const y = (row + 0.5) * GAP;
    parts.push(`M${x} ${y}h${(length - 1) * GAP + 0.01}`);
  }
  return parts.join("");
})();

export const MAP_DOT_GAP = GAP;
