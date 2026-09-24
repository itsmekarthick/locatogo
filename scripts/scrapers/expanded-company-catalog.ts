export interface ExpandedCompanyRecord {
  title: string;
  slug: string;
  short_description: string;
  website: string;
  careers_url: string;
  address_line_1: string;
  locality: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
  latitude: number;
  longitude: number;
  company_type: "product_saas" | "tech_giant_mnc" | "startup" | "deeptech_hardware";
  funding_stage: string;
}

export const EXPANDED_COMPANIES_BY_METRO: Record<string, ExpandedCompanyRecord[]> = {
  // 1. Paris, France
  paris: [
    {
      title: "Mistral AI",
      slug: "mistral-ai",
      short_description: "Frontier European AI lab developing world-class open-weight and commercial large language models.",
      website: "https://mistral.ai",
      careers_url: "https://jobs.ashbyhq.com/mistral.ai",
      address_line_1: "15 Boulevard Poissonnière",
      locality: "Silicon Sentier",
      city: "Paris",
      state: "Île-de-France",
      postal_code: "75002",
      country_code: "FR",
      latitude: 48.8711,
      longitude: 2.3456,
      company_type: "startup",
      funding_stage: "Unicorn",
    },
    {
      title: "Doctolib",
      slug: "doctolib",
      short_description: "Leading European healthcare technology platform connecting patients with healthcare professionals.",
      website: "https://doctolib.fr",
      careers_url: "https://boards.greenhouse.io/doctolib",
      address_line_1: "54 Quai Charles Pasqua",
      locality: "Levallois-Perret",
      city: "Paris",
      state: "Île-de-France",
      postal_code: "92300",
      country_code: "FR",
      latitude: 48.8941,
      longitude: 2.2789,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
    {
      title: "Dataiku",
      slug: "dataiku",
      short_description: "Everyday AI platform enabling organizations to build data science, machine learning, and generative AI pipelines.",
      website: "https://dataiku.com",
      careers_url: "https://boards.greenhouse.io/dataiku",
      address_line_1: "203 Rue de Bercy",
      locality: "12th Arrondissement",
      city: "Paris",
      state: "Île-de-France",
      postal_code: "75012",
      country_code: "FR",
      latitude: 48.8447,
      longitude: 2.3741,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
  ],

  // 2. Amsterdam, Netherlands
  amsterdam: [
    {
      title: "Adyen",
      slug: "adyen",
      short_description: "Global financial technology platform providing end-to-end payments, data insights, and financial products in a single solution.",
      website: "https://adyen.com",
      careers_url: "https://boards.greenhouse.io/adyen",
      address_line_1: "Simon Carmiggeltstraat 6-50",
      locality: "Centrum",
      city: "Amsterdam",
      state: "North Holland",
      postal_code: "1011 DJ",
      country_code: "NL",
      latitude: 52.3785,
      longitude: 4.9056,
      company_type: "product_saas",
      funding_stage: "Public",
    },
    {
      title: "Bird",
      slug: "bird",
      short_description: "Global cloud communications and customer engagement platform connecting enterprises to billions of mobile users.",
      website: "https://bird.com",
      careers_url: "https://boards.greenhouse.io/bird",
      address_line_1: "Trompenburgstraat 2C",
      locality: "Amsterdam-Zuid",
      city: "Amsterdam",
      state: "North Holland",
      postal_code: "1079 TX",
      country_code: "NL",
      latitude: 52.3435,
      longitude: 4.9080,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
    {
      title: "Elastic",
      slug: "elastic",
      short_description: "Search AI company behind Elasticsearch and Kibana, delivering enterprise search, observability, and security.",
      website: "https://elastic.co",
      careers_url: "https://boards.greenhouse.io/elastic",
      address_line_1: "Keizersgracht 281",
      locality: "Grachtengordel",
      city: "Amsterdam",
      state: "North Holland",
      postal_code: "1016 ED",
      country_code: "NL",
      latitude: 52.3705,
      longitude: 4.8842,
      company_type: "product_saas",
      funding_stage: "Public",
    },
  ],

  // 3. Dublin, Ireland
  dublin: [
    {
      title: "Intercom",
      slug: "intercom",
      short_description: "The complete AI customer service platform powered by Fin AI Copilot for modern support teams.",
      website: "https://intercom.com",
      careers_url: "https://boards.greenhouse.io/intercom",
      address_line_1: "122-124 St Stephen's Green",
      locality: "St Stephen's Green",
      city: "Dublin",
      state: "Leinster",
      postal_code: "D02 P594",
      country_code: "IE",
      latitude: 53.3382,
      longitude: -6.2625,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
  ],

  // 4. Dubai, UAE
  dubai: [
    {
      title: "Careem",
      slug: "careem",
      short_description: "The Middle East's leading everyday Super App offering ride-hailing, food delivery, and digital payments.",
      website: "https://careem.com",
      careers_url: "https://boards.greenhouse.io/careem",
      address_line_1: "Dubai Internet City, Building 14",
      locality: "Dubai Internet City",
      city: "Dubai",
      state: "Dubai",
      postal_code: "00000",
      country_code: "AE",
      latitude: 25.0934,
      longitude: 55.1557,
      company_type: "startup",
      funding_stage: "Unicorn",
    },
    {
      title: "Bybit",
      slug: "bybit",
      short_description: "Global cryptocurrency exchange and Web3 digital asset infrastructure platform headquartered in Dubai.",
      website: "https://bybit.com",
      careers_url: "https://boards.greenhouse.io/bybit",
      address_line_1: "One Central, Dubai World Trade Centre",
      locality: "Trade Centre",
      city: "Dubai",
      state: "Dubai",
      postal_code: "00000",
      country_code: "AE",
      latitude: 25.2265,
      longitude: 55.2858,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
  ],

  // 5. Tokyo, Japan
  tokyo: [
    {
      title: "PayPay",
      slug: "paypay",
      short_description: "Japan's leading cashless payment and mobile fintech superapp serving tens of millions of users nationwide.",
      website: "https://paypay.ne.jp",
      careers_url: "https://boards.greenhouse.io/paypay",
      address_line_1: "Tokyo Garden Terrace Kioicho, 1-3 Kioicho",
      locality: "Chiyoda",
      city: "Tokyo",
      state: "Tokyo",
      postal_code: "102-8282",
      country_code: "JP",
      latitude: 35.6814,
      longitude: 139.7366,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
  ],

  // 6. Sydney, Australia
  sydney: [
    {
      title: "Culture Amp",
      slug: "cultureamp",
      short_description: "Leading employee experience platform that combines behavioral science and analytics to transform company culture.",
      website: "https://cultureamp.com",
      careers_url: "https://boards.greenhouse.io/cultureamp",
      address_line_1: "333 George St",
      locality: "Sydney CBD",
      city: "Sydney",
      state: "NSW",
      postal_code: "2000",
      country_code: "AU",
      latitude: -33.8688,
      longitude: 151.2072,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
  ],
};
