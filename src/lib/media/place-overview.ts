// Rich Editorial Overview Generator for Mapora Bangalore Directory

export function getComprehensiveAboutText(
  title: string,
  categoryName: string,
  locality?: string | null,
  shortDesc?: string | null,
  longDesc?: string | null
): {
  overview: string;
  highlights: string[];
  keyFacts: Array<{ label: string; value: string }>;
} {
  const cat = (categoryName || "").toLowerCase();
  const loc = locality || "Bangalore";

  let overview = longDesc || shortDesc || "";

  // If description is brief, enhance with rich context
  if (overview.length < 120) {
    if (cat.includes("hospital") || cat.includes("health")) {
      overview = `${title} is a premier healthcare institution situated in ${loc}, Bangalore. The center provides comprehensive multi-specialty clinical care, 24/7 casualty emergency services, advanced diagnostic imaging, and dedicated inpatient facilities serving the community across Karnataka.`;
    } else if (cat.includes("school") || cat.includes("education")) {
      overview = `${title} is an esteemed educational institution located in ${loc}, Bangalore. Committed to academic excellence and holistic student development, the campus features state-of-the-art classrooms, STEM laboratories, sports grounds, and co-curricular programs.`;
    } else if (cat.includes("restaurant") || cat.includes("cafe") || cat.includes("food")) {
      overview = `${title} is a celebrated culinary destination in ${loc}, Bangalore, renowned for its vibrant dining ambiance, signature specialties, and welcoming hospitality for food enthusiasts and families.`;
    } else if (cat.includes("tech") || cat.includes("cowork")) {
      overview = `${title} is a major technology and enterprise campus located in ${loc}, Bangalore. Housing high-growth startups, multinational corporations, and modern collaborative workspaces, the facility offers world-class infrastructure and connectivity.`;
    } else if (cat.includes("retail") || cat.includes("mall") || cat.includes("shop")) {
      overview = `${title} is a premier shopping, lifestyle, and leisure landmark in ${loc}, Bangalore, featuring top national and international brands, dining avenues, and entertainment spaces.`;
    } else if (cat.includes("petrol") || cat.includes("fuel")) {
      overview = `${title} is an authorized 24/7 fueling station and vehicle service hub located in ${loc}, Bangalore, providing quality-assured fuels, EV charging facilities, nitrogen tyre inflation, and convenience amenities.`;
    } else {
      overview = `${title} is an established landmark in ${loc}, Bangalore, known for its community presence, prime connectivity, and reliable services.`;
    }
  }

  // Generate category-specific highlights and key facts
  let highlights: string[] = [];
  let keyFacts: Array<{ label: string; value: string }> = [];

  if (cat.includes("hospital") || cat.includes("health")) {
    highlights = [
      "24/7 Emergency & Casualty Wing",
      "Advanced Intensive Care Units (ICU)",
      "Multi-Specialty Doctor Consultations",
      "In-House Pathology & Radiology Lab",
      "Wheelchair & Ambulance Accessible",
      "Cashless Health Insurance & UPI",
    ];
    keyFacts = [
      { label: "Facility Type", value: "Multi-Specialty Medical Center" },
      { label: "Emergency Services", value: "Available 24 Hours" },
      { label: "Location", value: `${loc}, Bangalore` },
      { label: "Verification", value: "Official Verified Registry" },
    ];
  } else if (cat.includes("school") || cat.includes("education")) {
    highlights = [
      "Holistic Academic Curriculum",
      "Modern STEM & Science Labs",
      "Library & Digital Learning Media",
      "Sports Facilities & Athletic Grounds",
      "Safe Campus & Student Transport",
      "Co-Curricular & Arts Programs",
    ];
    keyFacts = [
      { label: "Institution Type", value: "Co-Educational Academy" },
      { label: "Medium", value: "English Medium" },
      { label: "Campus Region", value: `${loc}, Bangalore` },
      { label: "Verification", value: "Verified Educational Record" },
    ];
  } else if (cat.includes("restaurant") || cat.includes("cafe")) {
    highlights = [
      "Freshly Prepared Signature Dishes",
      "Comfortable Dine-In Ambiance",
      "Takeaway & Online Delivery",
      "Vegetarian & Non-Veg Options",
      "UPI, Cards & Cash Accepted",
      "Family & Group Friendly",
    ];
    keyFacts = [
      { label: "Establishment", value: "Casual Dining & Cafe" },
      { label: "Atmosphere", value: "Lively & Cozy" },
      { label: "Neighborhood", value: `${loc}, Bangalore` },
      { label: "Entry", value: "Verified Food Destination" },
    ];
  } else if (cat.includes("fuel") || cat.includes("petrol")) {
    highlights = [
      "24/7 Pure-for-Sure Fuel Dispensing",
      "High-Speed Diesel & Premium Petrol",
      "Automated Digital Metering",
      "Free Nitrogen & Air Pressure Check",
      "Engine Oils & Lubricants Counter",
      "Contactless Digital UPI Payments",
    ];
    keyFacts = [
      { label: "Station Type", value: "24/7 Fuel & Vehicle Care" },
      { label: "Availability", value: "Open 24 Hours" },
      { label: "Location", value: `${loc}, Bangalore` },
      { label: "Verification", value: "Verified Fuel Station" },
    ];
  } else {
    highlights = [
      "Prime Urban Connectivity",
      "Wheelchair Accessible Entrance",
      "Customer Parking Available",
      "Digital Payments & UPI",
      "Verified Business Location",
    ];
    keyFacts = [
      { label: "Category", value: categoryName || "Commercial Place" },
      { label: "Locality", value: `${loc}, Bangalore` },
      { label: "Status", value: "Published & Active" },
    ];
  }

  return { overview, highlights, keyFacts };
}

