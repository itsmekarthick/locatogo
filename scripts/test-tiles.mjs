async function testTile(name, url) {
  console.log(`Testing tile: ${name}`);
  const sampleUrl = url.replace("{s}", "a").replace("{z}", "13").replace("{x}", "7458").replace("{y}", "4798").replace("{r}", "");
  try {
    const res = await fetch(sampleUrl);
    console.log(`- Status for ${name}:`, res.status, res.headers.get("content-type"));
  } catch (e) {
    console.error(`- Error for ${name}:`, e.message);
  }
}

async function run() {
  await testTile("OSM Standard", "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  await testTile("ESRI World Street", "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}");
  await testTile("ESRI World Imagery (Satellite)", "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}");
  await testTile("Carto Voyager", "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png");
}

run();

