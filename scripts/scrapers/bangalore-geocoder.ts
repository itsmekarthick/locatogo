export interface BangaloreLocation {
  locality: string;
  address_line_1: string;
  latitude: number;
  longitude: number;
  postal_code: string;
}

export const BANGALORE_TECH_HUBS: Record<
  string,
  { locality: string; defaultAddress: string; lat: number; lng: number; postalCode: string }
> = {
  bellandur: {
    locality: "Bellandur (ORR)",
    defaultAddress: "Outer Ring Road, Bellandur",
    lat: 12.926,
    lng: 77.676,
    postalCode: "560103",
  },
  kadubeesanahalli: {
    locality: "Kadubeesanahalli",
    defaultAddress: "Prestige Tech Park, Outer Ring Rd, Kadubeesanahalli",
    lat: 12.937,
    lng: 77.694,
    postalCode: "560103",
  },
  devarabisanahalli: {
    locality: "Devarabisanahalli",
    defaultAddress: "RMZ Ecoworld, Campus 30, Devarabisanahalli",
    lat: 12.923,
    lng: 77.684,
    postalCode: "560103",
  },
  whitefield: {
    locality: "Whitefield",
    defaultAddress: "ITPB Road, Whitefield",
    lat: 12.986,
    lng: 77.738,
    postalCode: "560066",
  },
  epip: {
    locality: "EPIP Zone, Whitefield",
    defaultAddress: "Export Promotion Industrial Park, Whitefield",
    lat: 12.977,
    lng: 77.726,
    postalCode: "560066",
  },
  electronic_city: {
    locality: "Electronic City Phase 1",
    defaultAddress: "Hosur Road, Electronic City Phase 1",
    lat: 12.845,
    lng: 77.663,
    postalCode: "560100",
  },
  electronic_city_2: {
    locality: "Electronic City Phase 2",
    defaultAddress: "Electronic City Phase 2",
    lat: 12.839,
    lng: 77.682,
    postalCode: "560100",
  },
  koramangala: {
    locality: "Koramangala",
    defaultAddress: "80 Feet Rd, Koramangala",
    lat: 12.934,
    lng: 77.623,
    postalCode: "560034",
  },
  hsr: {
    locality: "HSR Layout",
    defaultAddress: "27th Main Rd, HSR Layout Sector 1",
    lat: 12.912,
    lng: 77.644,
    postalCode: "560102",
  },
  domlur: {
    locality: "Domlur / EGL",
    defaultAddress: "Embassy GolfLinks Business Park, Domlur",
    lat: 12.953,
    lng: 77.648,
    postalCode: "560071",
  },
  indiranagar: {
    locality: "Indiranagar",
    defaultAddress: "100 Feet Road, Indiranagar",
    lat: 12.978,
    lng: 77.641,
    postalCode: "560038",
  },
  manyata: {
    locality: "Hebbal / Manyata",
    defaultAddress: "Manyata Embassy Business Park, Outer Ring Rd, Nagavara",
    lat: 13.048,
    lng: 77.621,
    postalCode: "560045",
  },
  cv_raman_nagar: {
    locality: "CV Raman Nagar",
    defaultAddress: "Bagmane Tech Park, Byrasandra, CV Raman Nagar",
    lat: 12.983,
    lng: 77.659,
    postalCode: "560093",
  },
  marathahalli: {
    locality: "Marathahalli",
    defaultAddress: "Marathahalli - Sarjapur Outer Ring Rd",
    lat: 12.955,
    lng: 77.701,
    postalCode: "560037",
  },
  mg_road: {
    locality: "Central Business District (MG Road)",
    defaultAddress: "MG Road, Craig Park Layout, Ashok Nagar",
    lat: 12.973,
    lng: 77.608,
    postalCode: "560001",
  },
};

const HUBS_LIST = Object.values(BANGALORE_TECH_HUBS);

export function geocodeBangaloreText(locationHint: string, companyName: string): BangaloreLocation {
  const lowerHint = (locationHint + " " + companyName).toLowerCase();

  // 1. Check for specific locality keywords
  if (lowerHint.includes("whitefield") || lowerHint.includes("itpb") || lowerHint.includes("hoodi")) {
    return addJitter(BANGALORE_TECH_HUBS.whitefield, companyName);
  }
  if (lowerHint.includes("epip")) {
    return addJitter(BANGALORE_TECH_HUBS.epip, companyName);
  }
  if (lowerHint.includes("electronic city") || lowerHint.includes("ecity") || lowerHint.includes("e-city")) {
    return addJitter(BANGALORE_TECH_HUBS.electronic_city, companyName);
  }
  if (lowerHint.includes("koramangala")) {
    return addJitter(BANGALORE_TECH_HUBS.koramangala, companyName);
  }
  if (lowerHint.includes("hsr")) {
    return addJitter(BANGALORE_TECH_HUBS.hsr, companyName);
  }
  if (lowerHint.includes("manyata") || lowerHint.includes("hebbal") || lowerHint.includes("nagavara")) {
    return addJitter(BANGALORE_TECH_HUBS.manyata, companyName);
  }
  if (lowerHint.includes("domlur") || lowerHint.includes("embassy golf") || lowerHint.includes("egl")) {
    return addJitter(BANGALORE_TECH_HUBS.domlur, companyName);
  }
  if (lowerHint.includes("indiranagar") || lowerHint.includes("hal ")) {
    return addJitter(BANGALORE_TECH_HUBS.indiranagar, companyName);
  }
  if (lowerHint.includes("bagmane") || lowerHint.includes("cv raman")) {
    return addJitter(BANGALORE_TECH_HUBS.cv_raman_nagar, companyName);
  }
  if (lowerHint.includes("ecoworld") || lowerHint.includes("ecospace") || lowerHint.includes("devarabisanahalli")) {
    return addJitter(BANGALORE_TECH_HUBS.devarabisanahalli, companyName);
  }
  if (lowerHint.includes("kadubeesanahalli") || lowerHint.includes("cessna")) {
    return addJitter(BANGALORE_TECH_HUBS.kadubeesanahalli, companyName);
  }
  if (lowerHint.includes("bellandur") || lowerHint.includes("outer ring") || lowerHint.includes("orr")) {
    return addJitter(BANGALORE_TECH_HUBS.bellandur, companyName);
  }
  if (lowerHint.includes("marathahalli")) {
    return addJitter(BANGALORE_TECH_HUBS.marathahalli, companyName);
  }
  if (lowerHint.includes("mg road") || lowerHint.includes("lavelle") || lowerHint.includes("richmond")) {
    return addJitter(BANGALORE_TECH_HUBS.mg_road, companyName);
  }

  // 2. Deterministic distribution across primary tech clusters based on company name hash
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = (hash << 5) - hash + companyName.charCodeAt(i);
    hash |= 0;
  }
  const hubIndex = Math.abs(hash) % HUBS_LIST.length;
  return addJitter(HUBS_LIST[hubIndex], companyName);
}

function addJitter(
  base: { locality: string; defaultAddress: string; lat: number; lng: number; postalCode: string },
  seed: string
): BangaloreLocation {
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < seed.length; i++) {
    h1 = (h1 * 31 + seed.charCodeAt(i)) % 10000;
    h2 = (h2 * 37 + seed.charCodeAt(i)) % 10000;
  }

  // Small realistic offset (~100m to 600m)
  const latOffset = ((h1 - 5000) / 5000) * 0.006;
  const lngOffset = ((h2 - 5000) / 5000) * 0.006;

  return {
    locality: base.locality,
    address_line_1: `${base.defaultAddress}`,
    latitude: Number((base.lat + latOffset).toFixed(5)),
    longitude: Number((base.lng + lngOffset).toFixed(5)),
    postal_code: base.postalCode,
  };
}
