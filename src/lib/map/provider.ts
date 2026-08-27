export type MapTileConfiguration = {
  urlTemplate: string;
  attribution: string;
};

export interface MapProvider {
  getTileConfiguration(): MapTileConfiguration;
}

export function getMapTileConfiguration(): MapTileConfiguration {
  return {
    urlTemplate:
      process.env.NEXT_PUBLIC_MAP_TILE_URL ??
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  };
}
