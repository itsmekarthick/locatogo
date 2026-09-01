// High-Speed Offline Postcode Centroid Dictionary
// Maps Bangalore Pincodes (560xxx) to real latitude & longitude centroids

export const BANGALORE_PINCODE_COORDINATES: Record<
  string,
  { name: string; lat: number; lon: number }
> = {
  "560001": { name: "MG Road / Brigade Road / CBD", lat: 12.9754, lon: 77.6024 },
  "560002": { name: "City Market / KR Market", lat: 12.9644, lon: 77.5772 },
  "560003": { name: "Malleswaram", lat: 13.0031, lon: 77.5643 },
  "560004": { name: "Basavanagudi", lat: 12.9416, lon: 77.5753 },
  "560008": { name: "Ulsoor / Halasuru", lat: 12.9784, lon: 77.6256 },
  "560010": { name: "Rajajinagar", lat: 12.9982, lon: 77.553 },
  "560011": { name: "Jayanagar", lat: 12.925, lon: 77.5938 },
  "560016": { name: "Old Madras Road / RMZ Infinity", lat: 12.9936, lon: 77.6607 },
  "560017": { name: "Vimanapura / HAL Old Airport Rd", lat: 12.9558, lon: 77.6698 },
  "560025": { name: "Richmond Town / Ashok Nagar", lat: 12.9667, lon: 77.6083 },
  "560029": { name: "Bannerghatta Rd / IBC Knowledge Park", lat: 12.9312, lon: 77.5998 },
  "560034": { name: "Koramangala 1st-4th Block", lat: 12.9344, lon: 77.6291 },
  "560037": { name: "Marathahalli", lat: 12.9591, lon: 77.6974 },
  "560038": { name: "Indiranagar 100 Feet Road", lat: 12.9719, lon: 77.6412 },
  "560041": { name: "Jayanagar 4th/9th Block", lat: 12.9205, lon: 77.5855 },
  "560043": { name: "Banaswadi / HRBR Layout", lat: 13.0142, lon: 77.6519 },
  "560045": { name: "Manyata Embassy Tech Park / Nagawara", lat: 13.0424, lon: 77.6215 },
  "560047": { name: "Austin Town / Neelasandra", lat: 12.9583, lon: 77.6167 },
  "560048": { name: "Mahadevapura / Doddanakundi", lat: 12.9866, lon: 77.6978 },
  "560052": { name: "Vasanth Nagar / Cunningham Rd", lat: 12.9889, lon: 77.5917 },
  "560055": { name: "Sadashivanagar", lat: 13.0078, lon: 77.5794 },
  "560066": { name: "Whitefield / ITPB / EPIP Zone", lat: 12.9785, lon: 77.7221 },
  "560068": { name: "Madivala / Bommanahalli", lat: 12.9083, lon: 77.6242 },
  "560070": { name: "Padmanabhanagar / Banashankari", lat: 12.9181, lon: 77.5583 },
  "560071": { name: "Domlur / Embassy GolfLinks Tech Park", lat: 12.9606, lon: 77.6417 },
  "560075": { name: "CV Raman Nagar / Bagmane Tech Park", lat: 12.9858, lon: 77.6631 },
  "560076": { name: "BTM Layout 2nd Stage", lat: 12.9166, lon: 77.6101 },
  "560078": { name: "JP Nagar 1st-6th Phase", lat: 12.9081, lon: 77.5959 },
  "560085": { name: "Banashankari 3rd Stage", lat: 12.9306, lon: 77.5458 },
  "560087": { name: "Sarjapur Road / Kadubeesanahalli", lat: 12.9366, lon: 77.6938 },
  "560092": { name: "Sahakara Nagar / Hebbal", lat: 13.0622, lon: 77.5928 },
  "560095": { name: "Koramangala 5th-8th Block", lat: 12.9352, lon: 77.6245 },
  "560100": { name: "Electronic City Phase 1", lat: 12.8499, lon: 77.6633 },
  "560102": { name: "HSR Layout Sector 1-7", lat: 12.9115, lon: 77.6521 },
  "560103": { name: "Bellandur / Outer Ring Road Tech Corridor", lat: 12.9268, lon: 77.6842 },
  "560104": { name: "Kengeri Satellite Town", lat: 12.9175, lon: 77.4839 },
  "560105": { name: "Sarjapur Town / Carmelaram", lat: 12.8594, lon: 77.7856 },
  "560107": { name: "Peenya Industrial Area", lat: 13.0286, lon: 77.5197 },
};

// London Outcode Postcode Centroids
export const LONDON_POSTCODE_COORDINATES: Record<string, { name: string; lat: number; lon: number }> = {
  EC1: { name: "Shoreditch / Old Street (Silicon Roundabout)", lat: 51.5255, lon: -0.0882 },
  EC2: { name: "City of London / Broadgate Tech Hub", lat: 51.5173, lon: -0.0833 },
  E1: { name: "Whitechapel / Aldgate Tech Corridor", lat: 51.5152, lon: -0.0592 },
  E14: { name: "Canary Wharf FinTech Hub (Level39)", lat: 51.5054, lon: -0.0208 },
  WC1: { name: "Bloomsbury / Holborn Tech Labs", lat: 51.5225, lon: -0.1224 },
  N1: { name: "Angel / Islington Tech District", lat: 51.5364, lon: -0.1033 },
  SE1: { name: "London Bridge / Southwark", lat: 51.5033, lon: -0.0933 },
  W1: { name: "Soho / Fitzrovia Digital Media", lat: 51.5136, lon: -0.1365 },
};

/**
 * Clean legal noise from corporate name to get brand title
 */
export function cleanCompanyBrandName(rawName: string): string {
  return rawName
    .replace(/\b(PRIVATE LIMITED|PVT\.?\s*LTD\.?|LIMITED|LTD\.?|LLP|INC\.?|CORP\.?|CORPORATION)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve GPS coordinates with smart centroid scattering
 */
export function resolvePincodeCoordinates(pincode: string): { lat: number; lon: number; locality: string } {
  const cleanPin = pincode.replace(/\D/g, "").trim();
  const match = BANGALORE_PINCODE_COORDINATES[cleanPin];

  if (match) {
    // Add realistic geographic scatter (+/- 200m to 400m) so multiple companies don't stack on one pixel
    const jitterLat = (Math.random() - 0.5) * 0.006;
    const jitterLon = (Math.random() - 0.5) * 0.006;
    return {
      lat: Number((match.lat + jitterLat).toFixed(5)),
      lon: Number((match.lon + jitterLon).toFixed(5)),
      locality: match.name,
    };
  }

  // Default Bangalore Central centroid with scatter
  const defJitterLat = (Math.random() - 0.5) * 0.04;
  const defJitterLon = (Math.random() - 0.5) * 0.04;
  return {
    lat: Number((12.9716 + defJitterLat).toFixed(5)),
    lon: Number((77.5946 + defJitterLon).toFixed(5)),
    locality: "Bengaluru Tech Hub",
  };
}
