/**
 * location-matcher.ts
 *
 * Provides normalized city key resolution and location matching for jobs
 * across all supported metro tech hubs.
 */

export function normalizeCityKey(city: string): string {
  const c = city.toLowerCase().trim();
  if (c.includes("bangalore") || c.includes("bengaluru") || c === "blr") return "bangalore";
  if (c.includes("hyderabad") || c.includes("secunderabad") || c === "hyd") return "hyderabad";
  if (c.includes("chennai") || c.includes("madras") || c === "maa") return "chennai";
  if (c.includes("pune") || c === "pnq") return "pune";
  if (c.includes("delhi") || c.includes("noida") || c.includes("gurgaon") || c.includes("gurugram")) return "delhi";
  if (c.includes("mumbai") || c.includes("bombay") || c.includes("thane") || c.includes("navi mumbai")) return "mumbai";
  if (c.includes("kolkata") || c.includes("calcutta")) return "kolkata";
  if (c.includes("kochi") || c.includes("cochin")) return "kochi";
  if (c.includes("san francisco") || c.includes("silicon valley") || c.includes("bay area")) return "silicon-valley";
  if (c.includes("new york") || c.includes("nyc") || c.includes("manhattan") || c.includes("brooklyn")) return "new-york";
  if (c.includes("seattle") || c.includes("bellevue") || c.includes("redmond")) return "seattle";
  if (c.includes("austin")) return "austin";
  if (c.includes("boston") || c.includes("cambridge") || c.includes("somerville")) return "boston";
  if (c.includes("los angeles") || c.includes("santa monica") || c.includes("culver")) return "los-angeles";
  if (c.includes("chicago") || c.includes("illinois") || c === "chi") return "chicago";
  if (c.includes("denver") || c.includes("boulder") || c.includes("colorado")) return "denver";
  if (c.includes("atlanta") || c.includes("georgia") || c === "atl") return "atlanta";
  if (c.includes("san diego") || c.includes("la jolla")) return "san-diego";
  if (c.includes("london") || c.includes("uk") || c.includes("united kingdom")) return "london";
  if (c.includes("toronto") || c.includes("ontario")) return "toronto";
  if (c.includes("berlin") || c.includes("germany")) return "berlin";
  if (c.includes("singapore") || c === "sg") return "singapore";
  if (c.includes("dubai") || c.includes("uae")) return "dubai";
  if (c.includes("paris") || c.includes("france")) return "paris";
  if (c.includes("amsterdam") || c.includes("netherlands") || c.includes("holland")) return "amsterdam";
  if (c.includes("dublin") || c.includes("ireland")) return "dublin";
  if (c.includes("tokyo") || c.includes("japan")) return "tokyo";
  if (c.includes("sydney") || c.includes("australia") || c === "syd") return "sydney";
  return c;
}

/**
 * Checks whether a job's reported location matches the target city/metro place.
 */
export function jobMatchesLocation(
  jobLocation: string | null | undefined,
  targetCity: string | null | undefined
): boolean {
  if (!targetCity) return true;
  if (!jobLocation) return false;

  const loc = jobLocation.toLowerCase();
  const cityKey = normalizeCityKey(targetCity);

  if (cityKey === "bangalore") {
    return (
      loc.includes("bangalore") ||
      loc.includes("bengaluru") ||
      loc.includes("blr") ||
      loc.includes("whitefield") ||
      loc.includes("electronic city") ||
      loc.includes("koramangala") ||
      loc.includes("bellandur") ||
      loc.includes("adugodi") ||
      loc.includes("indiranagar") ||
      loc.includes("marathahalli") ||
      loc.includes("kadubeesanahalli") ||
      loc.includes("manyata") ||
      loc.includes("domlur") ||
      loc.includes("hebbal") ||
      loc.includes("harlur") ||
      loc.includes("sarjapur")
    );
  }

  if (cityKey === "hyderabad") {
    return (
      loc.includes("hyderabad") ||
      loc.includes("secunderabad") ||
      loc.includes("hitec") ||
      loc.includes("gachibowli") ||
      loc.includes("madhapur") ||
      loc.includes("kondapur") ||
      loc.includes("financial district") ||
      loc.includes("raidurg") ||
      loc.includes("nanakramguda") ||
      loc.includes("kokapet") ||
      loc.includes("begumpet")
    );
  }

  if (cityKey === "chennai") {
    return (
      loc.includes("chennai") ||
      loc.includes("madras") ||
      loc.includes("omr") ||
      loc.includes("sholinganallur") ||
      loc.includes("taramani") ||
      loc.includes("siruseri") ||
      loc.includes("guindy") ||
      loc.includes("perungudi") ||
      loc.includes("tidel") ||
      loc.includes("guduvanchery")
    );
  }

  if (cityKey === "pune") {
    return (
      loc.includes("pune") ||
      loc.includes("hinjewadi") ||
      loc.includes("kharadi") ||
      loc.includes("magarpatta") ||
      loc.includes("baner") ||
      loc.includes("balewadi") ||
      loc.includes("yerwada") ||
      loc.includes("kalyani nagar") ||
      loc.includes("viman nagar")
    );
  }

  if (cityKey === "delhi") {
    return (
      loc.includes("delhi") ||
      loc.includes("gurugram") ||
      loc.includes("gurgaon") ||
      loc.includes("noida") ||
      loc.includes("greater noida") ||
      loc.includes("cyber city") ||
      loc.includes("cyberhub") ||
      loc.includes("faridabad") ||
      loc.includes("udyog vihar") ||
      loc.includes("connaught place")
    );
  }

  if (cityKey === "mumbai") {
    return (
      loc.includes("mumbai") ||
      loc.includes("navi mumbai") ||
      loc.includes("thane") ||
      loc.includes("bkc") ||
      loc.includes("bandra") ||
      loc.includes("powai") ||
      loc.includes("andheri") ||
      loc.includes("lower parel") ||
      loc.includes("vikhroli") ||
      loc.includes("goregaon") ||
      loc.includes("ghansoli")
    );
  }

  if (cityKey === "kolkata") {
    return (
      loc.includes("kolkata") ||
      loc.includes("calcutta") ||
      loc.includes("salt lake") ||
      loc.includes("rajarhat") ||
      loc.includes("new town") ||
      loc.includes("sector v")
    );
  }

  if (cityKey === "kochi") {
    return (
      loc.includes("kochi") ||
      loc.includes("cochin") ||
      loc.includes("infopark") ||
      loc.includes("kakkanad") ||
      loc.includes("smartcity")
    );
  }

  if (cityKey === "silicon-valley") {
    return (
      loc.includes("san francisco") ||
      loc.includes("mountain view") ||
      loc.includes("palo alto") ||
      loc.includes("sunnyvale") ||
      loc.includes("san jose") ||
      loc.includes("menlo park") ||
      loc.includes("silicon valley") ||
      loc.includes("bay area")
    );
  }

  if (cityKey === "new-york") return loc.includes("new york") || loc.includes("nyc") || loc.includes("manhattan") || loc.includes("brooklyn");
  if (cityKey === "seattle") return loc.includes("seattle") || loc.includes("bellevue") || loc.includes("wa") || loc.includes("washington");
  if (cityKey === "austin") return loc.includes("austin") || loc.includes("tx") || loc.includes("texas");
  if (cityKey === "boston") return loc.includes("boston") || loc.includes("cambridge") || loc.includes("ma") || loc.includes("massachusetts");
  if (cityKey === "los-angeles") return loc.includes("los angeles") || loc.includes("santa monica") || loc.includes("culver") || loc.includes("ca") || loc.includes("california");
  if (cityKey === "chicago") return loc.includes("chicago") || loc.includes("il") || loc.includes("illinois");
  if (cityKey === "denver") return loc.includes("denver") || loc.includes("boulder") || loc.includes("co") || loc.includes("colorado");
  if (cityKey === "atlanta") return loc.includes("atlanta") || loc.includes("ga") || loc.includes("georgia");
  if (cityKey === "san-diego") return loc.includes("san diego") || loc.includes("la jolla") || loc.includes("san marcos");
  if (cityKey === "london") return loc.includes("london") || loc.includes("united kingdom") || loc.includes("uk");
  if (cityKey === "toronto") return loc.includes("toronto") || loc.includes("on") || loc.includes("ontario") || loc.includes("canada");
  if (cityKey === "berlin") return loc.includes("berlin") || loc.includes("germany");
  if (cityKey === "singapore") return loc.includes("singapore");
  if (cityKey === "dubai") return loc.includes("dubai");
  if (cityKey === "paris") return loc.includes("paris") || loc.includes("france");
  if (cityKey === "amsterdam") return loc.includes("amsterdam") || loc.includes("netherlands");
  if (cityKey === "dublin") return loc.includes("dublin") || loc.includes("ireland");
  if (cityKey === "tokyo") return loc.includes("tokyo") || loc.includes("japan");
  if (cityKey === "sydney") return loc.includes("sydney") || loc.includes("australia") || loc.includes("nsw");

  const raw = targetCity.toLowerCase().trim();
  return loc.includes(raw);
}
