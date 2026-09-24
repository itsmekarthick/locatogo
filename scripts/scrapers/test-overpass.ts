export {};

async function testOverpass() {
  const query = `[out:json][timeout:25];(node["office"~"it|company|coworking"](37.70,-122.52,37.83,-122.35);way["office"~"it|company|coworking"](37.70,-122.52,37.83,-122.35););out center 100;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
      },
    });
    const data = await res.json();
    console.log("SF elements count:", data.elements?.length);
    if (data.elements?.length > 0) {
      const named = data.elements.filter((e: any) => e.tags?.name);
      console.log("Named businesses in SF bbox:", named.length);
      console.log("Sample:", named.slice(0, 3).map((e: any) => ({ name: e.tags?.name, website: e.tags?.website, office: e.tags?.office })));
    }
  } catch (err: any) {
    console.log("Overpass error:", err.message);
  }
}

testOverpass();
