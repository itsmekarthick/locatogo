import * as fs from "fs";
import * as path from "path";

// Read .env file directly
const envPath = path.resolve(process.cwd(), ".env");
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf-8");
} catch (e) {}

const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    envVars[key] = val;
  }
}

const key = envVars.GOOGLE_PLACES_API_KEY || envVars.NEXT_PUBLIC_GOOGLE_MAPS_KEY || envVars.GOOGLE_MAPS_API_KEY || envVars.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function testPlacesApiNew(apiKey) {
  if (!apiKey) return;

  const query = "Truffles Koramangala Bangalore";
  console.log(`\nTesting Places API (New) Search for: "${query}"`);

  const url = "https://places.googleapis.com/v1/places:searchText";
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.photos,places.userRatingCount",
      },
      body: JSON.stringify({ textQuery: query }),
    });

    const data = await res.json();
    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      console.log("Success! Found Place via Places API (New):");
      console.log("- Name:", place.displayName?.text);
      console.log("- Address:", place.formattedAddress);
      console.log("- Rating:", place.rating, `(${place.userRatingCount} reviews)`);
      console.log("- Photos count:", place.photos?.length || 0);
      if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        console.log("- Photo 1 Media URI:", `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1000&maxWidthPx=1200&key=${apiKey}`);
      }
    } else {
      console.log("Places API (New) Error/Empty:", data);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testPlacesApiNew(key);

