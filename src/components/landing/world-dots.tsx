import { MAP_DOT_GAP, WORLD_DOTS_PATH } from "@/lib/landing/map";

/** The continents as one static path of dots. Draws once; nothing here animates. */
export function WorldDots() {
  return (
    <path
      d={WORLD_DOTS_PATH}
      fill="none"
      strokeLinecap="round"
      strokeWidth={2.2}
      strokeDasharray={`0 ${MAP_DOT_GAP}`}
      className="stroke-fg-subtle/40"
    />
  );
}
