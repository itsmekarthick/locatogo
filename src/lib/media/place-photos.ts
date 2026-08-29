// Deterministic Unique Photo Engine for Mapora Places

export type PlacePhoto = {
  url: string;
  alt: string;
  caption: string;
  source?: "google_places" | "wikipedia" | "curated";
};

// Extensive categorized photo pools with verified high-res imagery
const PHOTO_POOLS = {
  burger_cafe: [
    { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80", caption: "Gourmet Burgers & American Classics" },
    { url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80", caption: "Crispy Fries & Loaded Platter" },
    { url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1000&q=80", caption: "Cafe Dining & Casual Seating" },
  ],
  artisan_cafe: [
    { url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80", caption: "Courtyard Garden Cafe Seating" },
    { url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80", caption: "Artisanal Brews & Pastries" },
    { url: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1000&q=80", caption: "Warm Ambient Cafe Interiors" },
  ],
  south_indian_tiffin_1: [
    { url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1000&q=80", caption: "Crispy Golden Ghee Masala Dosa" },
    { url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=80", caption: "Traditional Steamed Idli & Vada" },
    { url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80", caption: "Authentic South Indian Filter Coffee" },
  ],
  south_indian_tiffin_2: [
    { url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1000&q=80", caption: "Benne Masala Dosa with Coconut Chutney" },
    { url: "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=1000&q=80", caption: "Piping Hot Kesari Bath & Khara Bath" },
    { url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=80", caption: "Heritage Brass Tumbler Filter Kaapi" },
  ],
  brewery_pub_1: [
    { url: "https://images.unsplash.com/photo-1518176258769-f227c798150e?auto=format&fit=crop&w=1000&q=80", caption: "Artisanal Craft Beers On Tap" },
    { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=80", caption: "Brewpub Open Courtyard & Bar" },
    { url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1000&q=80", caption: "Wood-Fired Sourdough Pizzas & Starters" },
  ],
  brewery_pub_2: [
    { url: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&w=1000&q=80", caption: "Lakeside Open-Air Microbrewery" },
    { url: "https://images.unsplash.com/photo-1584225065152-4a1454aa3d4e?auto=format&fit=crop&w=1000&q=80", caption: "Craft IPA & Wheat Beer Flight" },
    { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", caption: "Rooftop Evening Dining Ambience" },
  ],
  specialty_coffee: [
    { url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80", caption: "Manual Pour-Over & Single Origin Roast" },
    { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80", caption: "Specialty Espresso & Cold Brews" },
    { url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80", caption: "Minimalist Modern Cafe Atmosphere" },
  ],
  bakery_dessert_1: [
    { url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80", caption: "Freshly Baked European Artisan Breads" },
    { url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1000&q=80", caption: "Signature Cakes & Decadent Pastries" },
    { url: "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=1000&q=80", caption: "Charming Outdoor Patio Seating" },
  ],
  icecream_dessert: [
    { url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1000&q=80", caption: "Signature Death by Chocolate Sundae" },
    { url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1000&q=80", caption: "Fresh Fruit Ice Creams & Shakes" },
    { url: "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=1000&q=80", caption: "Family Dessert Parlour Counter" },
  ],
  biryani_meals_1: [
    { url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80", caption: "Authentic Andhra Spicy Chicken Biryani" },
    { url: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1000&q=80", caption: "Spicy Banana-Leaf Traditional Thali" },
    { url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1000&q=80", caption: "Chilli Chicken & Guntur Specialties" },
  ],
  biryani_meals_2: [
    { url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=1000&q=80", caption: "Donne Biryani with Piping Hot Gravy" },
    { url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=80", caption: "Tandoori Chicken & Kebabs" },
    { url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1000&q=80", caption: "Late-Night Family Dining Hall" },
  ],

  // HEALTHCARE
  cardiac_super_hospital: [
    { url: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1000&q=80", caption: "Multispeciality Quaternary Hospital Tower" },
    { url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80", caption: "Advanced Cardiac Cath Lab & ICU" },
    { url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80", caption: "24/7 Emergency Trauma & Ambulance Bay" },
  ],
  cancer_transplant_center: [
    { url: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=1000&q=80", caption: "Oncology & Neuroscience Research Center" },
    { url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80", caption: "Precision Diagnostic Imaging Suites" },
    { url: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1000&q=80", caption: "Inpatient Recovery & Private Rooms" },
  ],
  orthopaedic_trauma: [
    { url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80", caption: "Specialized Orthopaedic Surgery Block" },
    { url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1000&q=80", caption: "Rehabilitation & Physiotherapy Center" },
    { url: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1000&q=80", caption: "Accident Trauma Consultation Wing" },
  ],
  maternity_pediatric: [
    { url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=80", caption: "Boutique Maternity & Birthing Suites" },
    { url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80", caption: "Neonatal Intensive Care Unit (NICU)" },
    { url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1000&q=80", caption: "Child Health & Pediatric Clinic" },
  ],
  community_clinic: [
    { url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80", caption: "Outpatient Medical Consultation" },
    { url: "https://images.unsplash.com/photo-1583912267670-6575ad4736f8?auto=format&fit=crop&w=1000&q=80", caption: "Diagnostic Pathology & Health Checks" },
    { url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80", caption: "Pharmacy & Day-Care Support" },
  ],

  // EDUCATION
  international_ib_school: [
    { url: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1000&q=80", caption: "Sprawling Green International Campus" },
    { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80", caption: "Interactive Digital STEM & Design Labs" },
    { url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80", caption: "Olympic Standard Sports Complex" },
  ],
  heritage_boarding_school: [
    { url: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1000&q=80", caption: "Historic Stone Architecture & Clock Tower" },
    { url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80", caption: "Heritage Library & Study Halls" },
    { url: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1000&q=80", caption: "Expansive Athletic & Cricket Grounds" },
  ],
  cbse_academy: [
    { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80", caption: "Modern Academic Classrooms & Labs" },
    { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80", caption: "Robotics & Science Discovery Wing" },
    { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=80", caption: "Auditorium & Co-Curricular Facilities" },
  ],

  // TECH & WORKSPACES
  glass_tech_park: [
    { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80", caption: "Iconic Glass Skyscraper Tech Towers" },
    { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80", caption: "Enterprise Executive Boardrooms" },
    { url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1000&q=80", caption: "Lush Green Central Plaza & Walkways" },
  ],
  coworking_campus: [
    { url: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1000&q=80", caption: "Dynamic Open Coworking & Hot Desks" },
    { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80", caption: "Startup Collaboration & Event Amphitheatre" },
    { url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80", caption: "Private Executive Cabins & Coffee Lounge" },
  ],

  // RETAIL & SHOPPING
  luxury_mall: [
    { url: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1000&q=80", caption: "Multi-Level Luxury Atrium & Skywalk" },
    { url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1000&q=80", caption: "International Designer Flagships" },
    { url: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1000&q=80", caption: "Lakeside Open Promenade & Dining" },
  ],
  street_market_silk: [
    { url: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1000&q=80", caption: "Traditional Mysore Silk & Heritage Bazaar" },
    { url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1000&q=80", caption: "Artisanal Handloom & Craft Showrooms" },
    { url: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=1000&q=80", caption: "Vibrant Commercial Shopping Boulevard" },
  ],

  // ARTS & CULTURE
  royal_palace_monument: [
    { url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1000&q=80", caption: "Tudor-Style Stone Turrets & Royal Grounds" },
    { url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80", caption: "Ornate Carved Wooden Interiors" },
    { url: "https://images.unsplash.com/photo-1599818485248-261517c27187?auto=format&fit=crop&w=1000&q=80", caption: "Historic Palace Gardens & Courtyard" },
  ],
  botanical_garden: [
    { url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1000&q=80", caption: "Victorian Glass House & Tropical Greenery" },
    { url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1000&q=80", caption: "Centuries-Old Bonsai & Canopy Trees" },
    { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80", caption: "Serene Lotus Lake & Jogging Trails" },
  ],
  theatre_performance: [
    { url: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1000&q=80", caption: "Grand Auditorium Stage & Acoustic Hall" },
    { url: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1000&q=80", caption: "Live Classical & Contemporary Theatre" },
    { url: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1000&q=80", caption: "Cultural Art Exhibits & Sculpture Foyer" },
  ],

  // FUEL & EV CHARGING
  fuel_petrol_station: [
    { url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80", caption: "24/7 Multi-Bay Fuel Dispenser Canopy" },
    { url: "https://images.unsplash.com/photo-1527018607637-a616330326d7?auto=format&fit=crop&w=1000&q=80", caption: "Air, Nitrogen & Quick Lube Service Bay" },
    { url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80", caption: "Highway Convenience Store & Rest Stop" },
  ],
  ev_charging_hub: [
    { url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1000&q=80", caption: "Ultra-Fast DC Fast Charging Stations" },
    { url: "https://images.unsplash.com/photo-1558441719-ef0489dd4c92?auto=format&fit=crop&w=1000&q=80", caption: "Smart EV Battery Swap & Lounge" },
    { url: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1000&q=80", caption: "Solar Canopy Clean Mobility Plaza" },
  ],
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a high-res, verified, deterministic photo set tailored to the place.
 */
export function getUniquePlacePhotos(slug: string, title: string, category: string): PlacePhoto[] {
  const s = (slug || "").toLowerCase();
  const t = (title || "").toLowerCase();
  const cat = (category || "").toLowerCase();
  const hash = simpleHash(s + t);

  // 1. FUEL / PETROL STATIONS & EV CHARGING HUBS (Strict First Priority)
  if (
    cat.includes("fuel") ||
    cat.includes("petrol") ||
    cat.includes("gas") ||
    s.includes("petrol") ||
    s.includes("fuel") ||
    s.includes("bpcl") ||
    s.includes("hpcl") ||
    s.includes("iocl") ||
    s.includes("shell") ||
    t.includes("petroleum") ||
    t.includes("fuel station")
  ) {
    if (s.includes("ev") || s.includes("ather") || s.includes("charging") || t.includes("charge")) {
      return PHOTO_POOLS.ev_charging_hub.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    return PHOTO_POOLS.fuel_petrol_station.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }

  // 2. HEALTHCARE & HOSPITALS
  if (
    cat.includes("health") ||
    cat.includes("hospital") ||
    cat.includes("clinic") ||
    cat.includes("medical") ||
    s.includes("hospital") ||
    s.includes("clinic") ||
    s.includes("care") ||
    s.includes("narayana") ||
    s.includes("manipal") ||
    s.includes("fortis") ||
    s.includes("aster") ||
    s.includes("sparsh") ||
    s.includes("athreya")
  ) {
    if (s.includes("narayana") || s.includes("hrudayalaya") || s.includes("heart") || s.includes("cardiac")) {
      return PHOTO_POOLS.cardiac_super_hospital.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    if (s.includes("kidwai") || s.includes("cancer") || s.includes("nimhans") || s.includes("neuro")) {
      return PHOTO_POOLS.cancer_transplant_center.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    if (s.includes("sparsh") || s.includes("ortho") || s.includes("bone") || s.includes("joint")) {
      return PHOTO_POOLS.orthopaedic_trauma.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    if (s.includes("cloudnine") || s.includes("motherhood") || s.includes("maternity") || s.includes("women")) {
      return PHOTO_POOLS.maternity_pediatric.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    const pools = [
      PHOTO_POOLS.cardiac_super_hospital,
      PHOTO_POOLS.orthopaedic_trauma,
      PHOTO_POOLS.maternity_pediatric,
      PHOTO_POOLS.community_clinic,
    ];
    return pools[hash % pools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }

  // 3. EDUCATION & SCHOOLS
  if (cat.includes("education") || cat.includes("school") || cat.includes("academy") || cat.includes("college") || s.includes("school") || s.includes("academy")) {
    if (s.includes("edify") || s.includes("greenwood") || s.includes("indus") || s.includes("inventure") || s.includes("international")) {
      return PHOTO_POOLS.international_ib_school.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    if (s.includes("cotton") || s.includes("joseph") || s.includes("baldwin") || s.includes("heritage")) {
      return PHOTO_POOLS.heritage_boarding_school.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    const pools = [
      PHOTO_POOLS.cbse_academy,
      PHOTO_POOLS.international_ib_school,
      PHOTO_POOLS.heritage_boarding_school,
    ];
    return pools[hash % pools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }

  // 4. TECH & COWORKING
  if (cat.includes("tech") || cat.includes("cowork") || s.includes("wework") || s.includes("bhive") || s.includes("tech-park")) {
    if (s.includes("wework") || s.includes("bhive") || s.includes("91spring") || s.includes("cowork") || s.includes("indiqube")) {
      return PHOTO_POOLS.coworking_campus.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    const pools = [PHOTO_POOLS.glass_tech_park, PHOTO_POOLS.coworking_campus];
    return pools[hash % pools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }

  // 5. RETAIL & SHOPPING
  if (cat.includes("retail") || cat.includes("mall") || cat.includes("shop") || s.includes("mall") || s.includes("ub-city") || s.includes("phoenix")) {
    if (s.includes("mall") || s.includes("ub-city") || s.includes("phoenix") || s.includes("orion") || s.includes("nexus") || s.includes("forum")) {
      return PHOTO_POOLS.luxury_mall.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    const pools = [PHOTO_POOLS.street_market_silk, PHOTO_POOLS.luxury_mall];
    return pools[hash % pools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }

  // 6. ARTS & LANDMARKS
  if (cat.includes("art") || cat.includes("landmark") || cat.includes("museum") || s.includes("palace") || s.includes("lalbagh") || s.includes("cubbon")) {
    if (s.includes("palace") || s.includes("iskcon") || s.includes("temple") || s.includes("monument")) {
      return PHOTO_POOLS.royal_palace_monument.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    if (s.includes("lalbagh") || s.includes("cubbon") || s.includes("garden") || s.includes("park")) {
      return PHOTO_POOLS.botanical_garden.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    if (s.includes("theatre") || s.includes("ranga") || s.includes("music") || s.includes("jagriti")) {
      return PHOTO_POOLS.theatre_performance.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
    }
    const pools = [
      PHOTO_POOLS.royal_palace_monument,
      PHOTO_POOLS.botanical_garden,
      PHOTO_POOLS.theatre_performance,
    ];
    return pools[hash % pools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }

  // 7. RESTAURANTS & CAFES (Specific word matching)
  if (s.includes("truffle") || t.includes("burger")) {
    return PHOTO_POOLS.burger_cafe.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }
  if (s.includes("vidyarthi") || s.startsWith("ctr-") || s.includes("-ctr-") || s.includes("brahmin") || s.startsWith("mtr-") || s.includes("-mtr-") || t.includes("dosa")) {
    const tiffinPools = [PHOTO_POOLS.south_indian_tiffin_1, PHOTO_POOLS.south_indian_tiffin_2];
    return tiffinPools[hash % tiffinPools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }
  if (s.includes("toit") || s.includes("brew") || s.includes("byg") || s.includes("windmill") || t.includes("brewery")) {
    const brewPools = [PHOTO_POOLS.brewery_pub_1, PHOTO_POOLS.brewery_pub_2];
    return brewPools[hash % brewPools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }
  if (s.includes("coffee") || s.includes("third-wave") || s.includes("pascucci") || s.includes("dyu") || s.includes("blue-tokai")) {
    const cafePools = [PHOTO_POOLS.specialty_coffee, PHOTO_POOLS.artisan_cafe];
    return cafePools[hash % cafePools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }
  if (s.includes("corner-house") || s.includes("ice-cream") || s.includes("polar-bear")) {
    return PHOTO_POOLS.icecream_dessert.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }
  if (s.includes("glen") || s.includes("bake") || s.includes("variar") || s.includes("patisserie")) {
    return PHOTO_POOLS.bakery_dessert_1.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }
  if (s.includes("nagarjuna") || s.includes("empire") || s.includes("meghana") || s.includes("biryani") || s.includes("shivaji")) {
    const biryaniPools = [PHOTO_POOLS.biryani_meals_1, PHOTO_POOLS.biryani_meals_2];
    return biryaniPools[hash % biryaniPools.length].map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
  }

  const allPools = Object.values(PHOTO_POOLS);
  const selected = allPools[hash % allPools.length];
  return selected.map(p => ({ ...p, alt: `${title} - ${p.caption}` }));
}
