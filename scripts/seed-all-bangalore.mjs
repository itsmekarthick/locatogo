import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpqizarctxbexawnzogb.supabase.co";
const supabaseKey = "sb_publishable_XFsYigKpFPQhMK9X73FBSQ_K25rV-xm";

const supabase = createClient(supabaseUrl, supabaseKey);

const tenant_id = "1c186ac3-a365-4653-bd47-b87758890dfb";
const domain_id = "461e4ee7-7a16-43b3-b342-5a968e44f306";

const CATEGORIES = {
  RESTAURANTS: "831abfbb-c697-4271-8936-f0db15391fb0",
  ARTS: "e8ac6702-0863-4ba5-9c12-8107b2ce1f6c",
  RETAIL: "30f7de05-0195-4220-be9b-be617059f124",
  TECH: "54f2fdaa-7953-4cd4-bdfa-9c6053fb8838",
};

const newPlaces = [
  // RESTAURANTS & CAFES
  {
    title: "Truffles Koramangala",
    slug: "truffles-koramangala",
    category_id: CATEGORIES.RESTAURANTS,
    locality: "Koramangala",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560034",
    country_code: "IN",
    latitude: 12.9338,
    longitude: 77.6228,
    phone: "+91 80 2552 2496",
    website: "https://truffles.co.in",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "Bustling cafe famous for its gourmet all-American burgers, hearty pasta, peri-peri chicken steaks, and decadent desserts in the heart of Koramangala.",
  },
  {
    title: "Vidyarthi Bhavan Gandhi Bazaar",
    slug: "vidyarthi-bhavan-gandhi-bazaar",
    category_id: CATEGORIES.RESTAURANTS,
    locality: "Basavanagudi",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560004",
    country_code: "IN",
    latitude: 12.9460,
    longitude: 77.5714,
    phone: "+91 80 2667 7588",
    website: "https://vidyarthibhavan.in",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "Iconic vintage heritage vegetarian restaurant founded in 1943, celebrated across India for its crispy golden butter masala dosas and filter coffee.",
  },
  {
    title: "Toit Brewpub Indiranagar",
    slug: "toit-brewpub-indiranagar",
    category_id: CATEGORIES.RESTAURANTS,
    locality: "Indiranagar",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560038",
    country_code: "IN",
    latitude: 12.9793,
    longitude: 77.6406,
    phone: "+91 90197 13388",
    website: "https://toit.in",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "Bangalore's flagship pioneer microbrewery located on 100 Feet Road, serving legendary craft beers, wood-fired pizzas, and classic pub fare.",
  },
  {
    title: "CTR - Shri Sagar Malleshwaram",
    slug: "ctr-shri-sagar-malleshwaram",
    category_id: CATEGORIES.RESTAURANTS,
    locality: "Malleshwaram",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560003",
    country_code: "IN",
    latitude: 13.0039,
    longitude: 77.5684,
    phone: "+91 80 2331 7531",
    website: "https://shrisagarctr.com",
    is_featured: false,
    verification_status: "verified",
    status: "published",
    short_description: "Legendary South Indian tiffin landmark on 7th Cross Malleshwaram, world-renowned for its melt-in-the-mouth Benne Masala Dosa and Poori Saagu.",
  },
  {
    title: "Third Wave Coffee Roasters Koramangala",
    slug: "third-wave-coffee-koramangala",
    category_id: CATEGORIES.RESTAURANTS,
    locality: "Koramangala",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560034",
    country_code: "IN",
    latitude: 12.9345,
    longitude: 77.6258,
    phone: "+91 80 4370 7695",
    website: "https://thirdwavecoffeeroasters.com",
    is_featured: false,
    verification_status: "verified",
    status: "published",
    short_description: "Specialty artisanal coffee house and roastery offering single-origin manual pour-overs, cold brews, and healthy all-day cafe bites in a modern workspace setting.",
  },

  // TECH & COWORKING
  {
    title: "WeWork Galaxy Residency Road",
    slug: "wework-galaxy-residency-road",
    category_id: CATEGORIES.TECH,
    locality: "Central Bangalore",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560025",
    country_code: "IN",
    latitude: 12.9718,
    longitude: 77.6052,
    phone: "+91 80 6828 7300",
    website: "https://wework.co.in",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "Premier flagship coworking ecosystem and startup campus featuring rooftop pools, wellness zones, private offices, and enterprise conference facilities.",
  },
  {
    title: "International Tech Park Bangalore (ITPB)",
    slug: "itpb-whitefield",
    category_id: CATEGORIES.TECH,
    locality: "Whitefield",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560066",
    country_code: "IN",
    latitude: 12.9868,
    longitude: 77.7382,
    phone: "+91 80 4188 0000",
    website: "https://capitaland.com",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "India's premier 69-acre IT technology park and Silicon Valley of India hub housing global Fortune 500 tech corporations, R&D labs, and tech amenities.",
  },
  {
    title: "Manyata Embassy Business Park",
    slug: "manyata-tech-park-hebbal",
    category_id: CATEGORIES.TECH,
    locality: "Hebbal",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560045",
    country_code: "IN",
    latitude: 13.0487,
    longitude: 77.6200,
    phone: "+91 80 4179 9999",
    website: "https://embassyofficeparks.com",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "One of Asia's largest integrated tech parks situated in North Bangalore, accommodating top multinational tech giants, green campuses, and corporate hubs.",
  },
  {
    title: "91springboard 8th Block Koramangala",
    slug: "91springboard-koramangala",
    category_id: CATEGORIES.TECH,
    locality: "Koramangala",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560095",
    country_code: "IN",
    latitude: 12.9388,
    longitude: 77.6189,
    phone: "+91 80 4748 6891",
    website: "https://91springboard.com",
    is_featured: false,
    verification_status: "verified",
    status: "published",
    short_description: "Vibrant 24/7 collaborative coworking space and startup incubator offering high-speed fiber connectivity, meeting pods, and investor networking events.",
  },

  // INDEPENDENT RETAIL & SHOPPING
  {
    title: "Commercial Street Shopping District",
    slug: "commercial-street-bangalore",
    category_id: CATEGORIES.RETAIL,
    locality: "Tasker Town",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560001",
    country_code: "IN",
    latitude: 12.9822,
    longitude: 77.6083,
    phone: "+91 80 2558 7600",
    website: "https://karnatakatourism.org",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "Bangalore's most vibrant traditional retail pedestrian promenade, celebrated for apparel, silk fabrics, antique jewellery, footwear, and bespoke tailoring.",
  },
  {
    title: "UB City Luxury Collection",
    slug: "ub-city-vittal-mallya",
    category_id: CATEGORIES.RETAIL,
    locality: "Central Bangalore",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560001",
    country_code: "IN",
    latitude: 12.9719,
    longitude: 77.5958,
    phone: "+91 80 2268 2222",
    website: "https://ubcitybangalore.in",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "India's first luxury commercial and retail destination on Vittal Mallya Road featuring high-end international designer fashion houses, fine dining, and art galleries.",
  },
  {
    title: "Phoenix Marketcity Whitefield",
    slug: "phoenix-marketcity-whitefield",
    category_id: CATEGORIES.RETAIL,
    locality: "Whitefield",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560048",
    country_code: "IN",
    latitude: 12.9972,
    longitude: 77.6967,
    phone: "+91 80 6726 6111",
    website: "https://phoenixmarketcity.com/bangalore",
    is_featured: false,
    verification_status: "verified",
    status: "published",
    short_description: "Bangalore's largest lifestyle and entertainment retail destination spanning over 1 million sq ft with 300+ global brands, multiplex, and open-air courtyards.",
  },

  // CREATIVE & ARTS
  {
    title: "National Gallery of Modern Art (NGMA)",
    slug: "ngma-bangalore",
    category_id: CATEGORIES.ARTS,
    locality: "Vasanth Nagar",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560052",
    country_code: "IN",
    latitude: 12.9882,
    longitude: 77.5878,
    phone: "+91 80 2234 2338",
    website: "https://ngmaindia.gov.in",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "Sprawling heritage mansion gallery set in 3.5-acre manicured gardens, showcasing masterworks of modern Indian art, sculpture exhibits, and cultural film screenings.",
  },
  {
    title: "Ranga Shankara Theatre",
    slug: "ranga-shankara-theatre",
    category_id: CATEGORIES.ARTS,
    locality: "JP Nagar",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560078",
    country_code: "IN",
    latitude: 12.9157,
    longitude: 77.5851,
    phone: "+91 80 2659 2777",
    website: "https://rangashankara.org",
    is_featured: true,
    verification_status: "verified",
    status: "published",
    short_description: "One of India's most prestigious cultural performance arts theatres founded in memory of Shankar Nag, hosting live drama plays, theatre festivals, and creative workshops.",
  },
  {
    title: "Karnataka Chitrakala Parishath",
    slug: "karnataka-chitrakala-parishath",
    category_id: CATEGORIES.ARTS,
    locality: "Kumara Krupa",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560001",
    country_code: "IN",
    latitude: 12.9904,
    longitude: 77.5824,
    phone: "+91 80 2226 1816",
    website: "https://karnatakachitrakalaparishath.com",
    is_featured: false,
    verification_status: "verified",
    status: "published",
    short_description: "Renowned art institute and cultural museum complex hosting 13 permanent galleries, folk art collections, international exhibitions, and the annual Chitra Santhe festival.",
  },
  {
    title: "Visvesvaraya Industrial & Technological Museum",
    slug: "visvesvaraya-museum-bangalore",
    category_id: CATEGORIES.ARTS,
    locality: "Kasturba Road",
    city: "Bangalore",
    administrative_area: "Karnataka",
    postal_code: "560001",
    country_code: "IN",
    latitude: 12.9752,
    longitude: 77.5962,
    phone: "+91 80 2286 6200",
    website: "https://vismuseum.gov.in",
    is_featured: false,
    verification_status: "verified",
    status: "published",
    short_description: "Premier science and technology innovation museum situated near Cubbon Park, featuring interactive aerospace halls, engine robotics, and 3D science theaters.",
  }
];

async function seed() {
  console.log(`Seeding ${newPlaces.length} new Bangalore places across all categories...`);

  for (const place of newPlaces) {
    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("domain_id", domain_id)
      .eq("slug", place.slug)
      .maybeSingle();

    if (existing) {
      console.log(`- Already exists: ${place.title}`);
      continue;
    }

    const payload = {
      tenant_id,
      domain_id,
      ...place,
    };

    const { data, error } = await supabase
      .from("listings")
      .insert(payload)
      .select("id, title, slug");

    if (error) {
      console.error(`Error inserting ${place.title}:`, error.message);
    } else {
      console.log(`✓ Inserted: ${place.title}`);
    }
  }

  const { count } = await supabase.from("listings").select("*", { count: "exact", head: true });
  console.log(`Seeding complete! Total listings in database: ${count}`);
}

seed();
