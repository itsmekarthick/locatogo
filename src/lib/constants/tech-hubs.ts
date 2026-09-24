export type TechHub = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  lat: number;
  lng: number;
  zoom: number;
};

export type CountryInfo = {
  name: string;
  code: string;
  flag: string;
  defaultHubId: string;
};

export const GLOBAL_COUNTRIES: CountryInfo[] = [
  { name: "All Countries", code: "ALL", flag: "🌐", defaultHubId: "bengaluru" },
  { name: "India", code: "IN", flag: "🇮🇳", defaultHubId: "bengaluru" },
  { name: "United States", code: "US", flag: "🇺🇸", defaultHubId: "silicon-valley" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", defaultHubId: "london" },
  { name: "Canada", code: "CA", flag: "🇨🇦", defaultHubId: "toronto" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", defaultHubId: "singapore" },
  { name: "Germany", code: "DE", flag: "🇩🇪", defaultHubId: "berlin" },
  { name: "UAE", code: "AE", flag: "🇦🇪", defaultHubId: "dubai" },
];

export type UnifiedJob = {
  id: string;
  title: string;
  department?: string | null;
  location_name: string;
  workplace_type: "on_site" | "hybrid" | "remote";
  experience_level?: string | null;
  salary_range?: string | null;
  apply_url: string;
  company_careers_url?: string | null;
  posted_at?: string | null;
  listing_id?: string;
  company_title?: string;
  company_slug?: string;
  company_type?: string | null;
  funding_stage?: string | null;
  locality?: string | null;
  city?: string | null;
  country_code?: string | null;
};

export const GLOBAL_TECH_HUBS: TechHub[] = [
  { id: "bengaluru", name: "Bengaluru", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 12.9716, lng: 77.5946, zoom: 12 },
  { id: "hyderabad", name: "Hyderabad", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 17.4399, lng: 78.375, zoom: 12 },
  { id: "delhi-ncr", name: "Delhi NCR", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 28.4988, lng: 77.0898, zoom: 12 },
  { id: "mumbai", name: "Mumbai", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 19.0689, lng: 72.8695, zoom: 12 },
  { id: "chennai", name: "Chennai", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 12.9658, lng: 80.2458, zoom: 12 },
  { id: "pune", name: "Pune", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 18.5912, lng: 73.7389, zoom: 12 },
  { id: "kolkata", name: "Kolkata", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 22.5726, lng: 88.4339, zoom: 12 },
  { id: "kochi", name: "Kochi", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 10.0159, lng: 76.3639, zoom: 13 },
  { id: "silicon-valley", name: "Silicon Valley & SF", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 37.7749, lng: -122.4194, zoom: 11 },
  { id: "new-york", name: "New York City", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 40.7128, lng: -74.006, zoom: 12 },
  { id: "seattle", name: "Seattle", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 47.6062, lng: -122.3321, zoom: 12 },
  { id: "austin", name: "Austin", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 30.2672, lng: -97.7431, zoom: 12 },
  { id: "boston", name: "Boston", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 42.3601, lng: -71.0589, zoom: 12 },
  { id: "los-angeles", name: "Los Angeles", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 34.0522, lng: -118.2437, zoom: 12 },
  { id: "chicago", name: "Chicago", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 41.8781, lng: -87.6298, zoom: 12 },
  { id: "denver", name: "Denver", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 39.7392, lng: -104.9903, zoom: 12 },
  { id: "atlanta", name: "Atlanta", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 33.7490, lng: -84.3880, zoom: 12 },
  { id: "san-diego", name: "San Diego", country: "United States", countryCode: "US", flag: "🇺🇸", lat: 32.7157, lng: -117.1611, zoom: 12 },
  { id: "london", name: "London", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", lat: 51.5074, lng: -0.1278, zoom: 12 },
  { id: "toronto", name: "Toronto", country: "Canada", countryCode: "CA", flag: "🇨🇦", lat: 43.6532, lng: -79.3832, zoom: 12 },
  { id: "berlin", name: "Berlin", country: "Germany", countryCode: "DE", flag: "🇩🇪", lat: 52.52, lng: 13.405, zoom: 12 },
  { id: "singapore", name: "Singapore", country: "Singapore", countryCode: "SG", flag: "🇸🇬", lat: 1.3521, lng: 103.8198, zoom: 12 },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", countryCode: "AE", flag: "🇦🇪", lat: 25.2048, lng: 55.2708, zoom: 12 },
];

export const TECH_SECTORS = [
  { id: "all", name: "All Sectors", icon: "🌐" },
  { id: "product_saas", name: "Product & SaaS", icon: "☁️" },
  { id: "tech_giant_mnc", name: "Tech Giants & GCC", icon: "🏛️" },
  { id: "it_services_consulting", name: "IT Services & Consulting", icon: "💻" },
  { id: "deeptech_hardware", name: "DeepTech & Hardware", icon: "⚡" },
  { id: "startup", name: "Startups", icon: "🚀" },
  { id: "vc_accelerator", name: "VC & Accelerators", icon: "📈" },
];

export const TECH_STAGES = [
  "all",
  "GCC",
  "Unicorn",
  "Public",
  "Series C+",
  "Series B",
  "Series A",
  "Seed",
  "Bootstrapped",
];

export const KNOWN_HUB_LOCALITIES: Record<string, { slug: string; name: string }[]> = {
  "bengaluru": [
    { slug: "whitefield", name: "Whitefield & ITPB" },
    { slug: "koramangala", name: "Koramangala" },
    { slug: "electronic-city", name: "Electronic City" },
    { slug: "outer-ring-road", name: "Outer Ring Road (ORR)" },
    { slug: "bellandur", name: "Bellandur" },
    { slug: "indiranagar", name: "Indiranagar" },
    { slug: "adugodi", name: "Adugodi" },
    { slug: "manyata", name: "Manyata Tech Park" },
    { slug: "marathahalli", name: "Marathahalli" },
    { slug: "hebbal", name: "Hebbal" },
  ],
  "hyderabad": [
    { slug: "hitec-city", name: "HITEC City" },
    { slug: "gachibowli", name: "Gachibowli" },
    { slug: "financial-district", name: "Financial District" },
    { slug: "madhapur", name: "Madhapur" },
    { slug: "raidurg", name: "Raidurg Knowledge City" },
  ],
  "delhi-ncr": [
    { slug: "cyber-city", name: "Cyber City (Gurugram)" },
    { slug: "sector-62-noida", name: "Sector 62 (Noida)" },
    { slug: "golf-course-road", name: "Golf Course Road" },
    { slug: "udyog-vihar", name: "Udyog Vihar" },
  ],
  "mumbai": [
    { slug: "bkc", name: "Bandra Kurla Complex (BKC)" },
    { slug: "powai", name: "Powai" },
    { slug: "lower-parel", name: "Lower Parel" },
    { slug: "andheri-east", name: "Andheri East" },
  ],
  "pune": [
    { slug: "hinjewadi", name: "Hinjewadi IT Park" },
    { slug: "kharadi", name: "Kharadi EON Free Zone" },
    { slug: "magarpatta", name: "Magarpatta Cybercity" },
    { slug: "baner", name: "Baner & Balewadi" },
  ],
  "chennai": [
    { slug: "omr", name: "OMR IT Corridor" },
    { slug: "taramani", name: "Taramani & TIDEL Park" },
    { slug: "siruseri", name: "Siruseri SIPCOT IT Park" },
    { slug: "guindy", name: "Guindy Industrial Estate" },
  ],
  "kolkata": [
    { slug: "sector-v", name: "Sector V, Salt Lake" },
    { slug: "new-town", name: "New Town & Rajarhat" },
  ],
  "kochi": [
    { slug: "infopark", name: "Infopark Kochi" },
    { slug: "kakkanad", name: "Kakkanad SmartCity" },
  ],
  "silicon-valley": [
    { slug: "soma", name: "SoMa" },
    { slug: "mission", name: "Mission District" },
    { slug: "financial-district", name: "Financial District" },
    { slug: "south-sf", name: "South San Francisco" },
  ],
  "new-york": [
    { slug: "midtown", name: "Midtown" },
    { slug: "flatiron", name: "Flatiron" },
    { slug: "hudson-yards", name: "Hudson Yards" },
    { slug: "chelsea", name: "Chelsea" },
  ],
  "seattle": [
    { slug: "downtown", name: "Downtown" },
    { slug: "bellevue", name: "Bellevue" },
    { slug: "pioneer-square", name: "Pioneer Square" },
  ],
  "austin": [
    { slug: "downtown", name: "Downtown" },
    { slug: "barton-hills", name: "Barton Hills" },
  ],
  "boston": [
    { slug: "fenway", name: "Fenway-Kenmore" },
    { slug: "cambridge", name: "Cambridge" },
    { slug: "somerville", name: "Somerville" },
  ],
  "los-angeles": [
    { slug: "west-la", name: "West LA" },
    { slug: "culver-city", name: "Culver City" },
    { slug: "west-adams", name: "West Adams" },
  ],
  "chicago": [
    { slug: "fulton-market", name: "Fulton Market" },
    { slug: "loop", name: "The Loop" },
    { slug: "river-north", name: "River North" },
  ],
  "denver": [
    { slug: "lodo", name: "LoDo" },
    { slug: "rino", name: "RiNo" },
    { slug: "boulder", name: "Boulder" },
  ],
  "atlanta": [
    { slug: "midtown", name: "Midtown" },
    { slug: "buckhead", name: "Buckhead" },
    { slug: "tech-square", name: "Tech Square" },
  ],
  "san-diego": [
    { slug: "utc-la-jolla", name: "UTC / La Jolla" },
    { slug: "downtown-sd", name: "Downtown" },
    { slug: "sorrento-valley", name: "Sorrento Valley" },
  ],
  "london": [
    { slug: "shoreditch", name: "Silicon Roundabout / Shoreditch" },
    { slug: "soho", name: "Soho & Fitzrovia" },
    { slug: "city", name: "City of London" },
  ],
  "toronto": [
    { slug: "downtown-to", name: "Downtown Toronto" },
    { slug: "king-west", name: "King West" },
    { slug: "financial-district", name: "Financial District" },
  ],
  "berlin": [
    { slug: "mitte", name: "Mitte" },
    { slug: "kreuzberg", name: "Kreuzberg" },
    { slug: "prenzlauer-berg", name: "Prenzlauer Berg" },
  ],
  "singapore": [
    { slug: "marina-bay", name: "Marina Bay" },
    { slug: "one-north", name: "One-North" },
    { slug: "tanjong-pagar", name: "Tanjong Pagar" },
  ],
};

export const KNOWN_HUB_COUNTS: Record<string, number> = {
  "bengaluru": 0,
  "delhi-ncr": 0,
  "mumbai": 0,
  "pune": 0,
  "chennai": 0,
  "hyderabad": 0,
  "kolkata": 0,
  "kochi": 0,
  "silicon-valley": 0,
  "new-york": 0,
  "seattle": 0,
  "austin": 0,
  "boston": 0,
  "los-angeles": 0,
  "chicago": 0,
  "denver": 0,
  "atlanta": 0,
  "san-diego": 0,
  "london": 0,
  "toronto": 0,
  "berlin": 0,
  "singapore": 0,
};

export function matchesHub(
  c: { city?: string | null; locality?: string | null; address_line_1?: string | null; country_code?: string | null },
  hub: TechHub
): boolean {
  const cc = (c.country_code || "").trim().toUpperCase();
  if (cc && hub.countryCode && cc !== hub.countryCode) {
    return false;
  }

  const city = (c.city || "").toLowerCase().trim();
  const loc = (c.locality || "").toLowerCase().trim();
  const addr = (c.address_line_1 || "").toLowerCase().trim();

  if (hub.id === "bengaluru") {
    if (city.includes("bangalore") || city.includes("bengaluru") || loc.includes("bangalore") || loc.includes("bengaluru")) {
      return true;
    }
    // Exclude other distinct Indian and global hubs
    if (
      city.includes("hyderabad") ||
      city.includes("delhi") ||
      city.includes("gurugram") ||
      city.includes("gurgaon") ||
      city.includes("noida") ||
      city.includes("mumbai") ||
      city.includes("chennai") ||
      city.includes("pune") ||
      city.includes("kolkata") ||
      city.includes("kochi") ||
      loc.includes("hyderabad") ||
      loc.includes("delhi") ||
      loc.includes("gurugram") ||
      loc.includes("gurgaon") ||
      loc.includes("noida") ||
      loc.includes("mumbai") ||
      loc.includes("bkc") ||
      loc.includes("powai") ||
      loc.includes("chennai") ||
      loc.includes("omr") ||
      loc.includes("sholinganallur") ||
      loc.includes("pune") ||
      loc.includes("hinjewadi") ||
      loc.includes("kharadi") ||
      loc.includes("kolkata") ||
      loc.includes("salt lake") ||
      loc.includes("kochi") ||
      loc.includes("infopark") ||
      addr.includes("hyderabad") ||
      addr.includes("delhi") ||
      addr.includes("mumbai") ||
      addr.includes("chennai") ||
      addr.includes("pune") ||
      addr.includes("kolkata") ||
      addr.includes("kochi")
    ) {
      return false;
    }
    return !city; // default unassigned is bengaluru
  }

  if (hub.id === "hyderabad") {
    return (
      city.includes("hyderabad") ||
      loc.includes("hyderabad") ||
      loc.includes("hitec") ||
      loc.includes("gachibowli") ||
      loc.includes("madhapur") ||
      loc.includes("financial district") ||
      loc.includes("kondapur") ||
      addr.includes("hyderabad")
    );
  }

  if (hub.id === "delhi-ncr" || hub.id === "delhi") {
    return (
      city.includes("delhi") ||
      city.includes("gurugram") ||
      city.includes("gurgaon") ||
      city.includes("noida") ||
      loc.includes("delhi") ||
      loc.includes("gurugram") ||
      loc.includes("gurgaon") ||
      loc.includes("noida") ||
      loc.includes("cyber city") ||
      loc.includes("cyberhub") ||
      loc.includes("udyog vihar") ||
      addr.includes("delhi") ||
      addr.includes("gurugram") ||
      addr.includes("noida")
    );
  }

  if (hub.id === "mumbai") {
    return (
      city.includes("mumbai") ||
      city.includes("navi mumbai") ||
      city.includes("thane") ||
      loc.includes("mumbai") ||
      loc.includes("bkc") ||
      loc.includes("bandra") ||
      loc.includes("powai") ||
      loc.includes("lower parel") ||
      loc.includes("andheri") ||
      loc.includes("vikhroli") ||
      loc.includes("goregaon") ||
      loc.includes("ghansoli") ||
      addr.includes("mumbai")
    );
  }

  if (hub.id === "chennai") {
    return (
      city.includes("chennai") ||
      city.includes("madras") ||
      loc.includes("chennai") ||
      loc.includes("omr") ||
      loc.includes("sholinganallur") ||
      loc.includes("taramani") ||
      loc.includes("siruseri") ||
      loc.includes("guindy") ||
      loc.includes("perungudi") ||
      loc.includes("guduvanchery") ||
      loc.includes("tidel") ||
      addr.includes("chennai")
    );
  }

  if (hub.id === "pune") {
    return (
      city.includes("pune") ||
      loc.includes("pune") ||
      loc.includes("hinjewadi") ||
      loc.includes("kharadi") ||
      loc.includes("magarpatta") ||
      loc.includes("baner") ||
      loc.includes("balewadi") ||
      loc.includes("kalyani nagar") ||
      loc.includes("yerwada") ||
      addr.includes("pune")
    );
  }

  if (hub.id === "kolkata") {
    return (
      city.includes("kolkata") ||
      city.includes("calcutta") ||
      loc.includes("kolkata") ||
      loc.includes("salt lake") ||
      loc.includes("rajarhat") ||
      loc.includes("new town") ||
      loc.includes("sector v") ||
      addr.includes("kolkata")
    );
  }

  if (hub.id === "kochi") {
    return (
      city.includes("kochi") ||
      city.includes("cochin") ||
      loc.includes("kochi") ||
      loc.includes("infopark") ||
      loc.includes("kakkanad") ||
      loc.includes("smartcity") ||
      addr.includes("kochi")
    );
  }

  if (hub.id === "silicon-valley") {
    return (
      city.includes("san francisco") ||
      city.includes("mountain view") ||
      city.includes("palo alto") ||
      city.includes("sunnyvale") ||
      city.includes("san jose") ||
      city.includes("menlo park") ||
      loc.includes("silicon valley") ||
      loc.includes("bay area")
    );
  }

  if (hub.id === "new-york") return city.includes("new york") || city.includes("nyc") || loc.includes("manhattan") || loc.includes("brooklyn") || loc.includes("flatiron") || loc.includes("chelsea");
  if (hub.id === "seattle") return city.includes("seattle") || city.includes("bellevue") || city.includes("redmond") || loc.includes("seattle") || loc.includes("bellevue") || addr.includes("seattle");
  if (hub.id === "austin") return city.includes("austin") || loc.includes("austin") || addr.includes("austin");
  if (hub.id === "boston") return city.includes("boston") || city.includes("cambridge") || city.includes("somerville") || loc.includes("boston") || loc.includes("cambridge") || addr.includes("boston");
  if (hub.id === "los-angeles") return city.includes("los angeles") || city.includes("santa monica") || city.includes("culver city") || city.includes("glendale") || loc.includes("los angeles") || loc.includes("culver") || addr.includes("los angeles");
  if (hub.id === "chicago") return city.includes("chicago") || loc.includes("chicago") || addr.includes("chicago") || loc.includes("fulton market") || loc.includes("loop");
  if (hub.id === "denver") return city.includes("denver") || city.includes("boulder") || loc.includes("denver") || loc.includes("boulder") || addr.includes("denver");
  if (hub.id === "atlanta") return city.includes("atlanta") || loc.includes("atlanta") || addr.includes("atlanta") || loc.includes("midtown");
  if (hub.id === "san-diego") return city.includes("san diego") || city.includes("la jolla") || loc.includes("san diego") || addr.includes("san diego");
  if (hub.id === "london") return city.includes("london") || loc.includes("london") || addr.includes("london") || loc.includes("shoreditch");
  if (hub.id === "toronto") return city.includes("toronto") || loc.includes("toronto") || addr.includes("toronto");
  if (hub.id === "berlin") return city.includes("berlin") || loc.includes("berlin") || addr.includes("berlin");
  if (hub.id === "singapore") return city.includes("singapore") || loc.includes("singapore") || addr.includes("singapore");
  if (hub.id === "dubai") return city.includes("dubai") || loc.includes("dubai");

  return city.includes(hub.name.toLowerCase()) || loc.includes(hub.name.toLowerCase());
}
