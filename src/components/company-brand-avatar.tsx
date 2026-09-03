"use client";

import { useState } from "react";

// Canonical mapping of top enterprise brands, hospitals, retail, and tech giants
const KNOWN_BRAND_DOMAINS: Record<string, string> = {
  infosys: "infosys.com",
  wipro: "wipro.com",
  tcs: "tcs.com",
  "tata consultancy": "tcs.com",
  "tata elxsi": "tataelxsi.com",
  cognizant: "cognizant.com",
  accenture: "accenture.com",
  ibm: "ibm.com",
  microsoft: "microsoft.com",
  google: "google.com",
  amazon: "amazon.com",
  apple: "apple.com",
  meta: "meta.com",
  facebook: "meta.com",
  flipkart: "flipkart.com",
  swiggy: "swiggy.com",
  zomato: "zomato.com",
  uber: "uber.com",
  ola: "olacabs.com",
  razorpay: "razorpay.com",
  phonepe: "phonepe.com",
  paytm: "paytm.com",
  cred: "cred.club",
  zerodha: "zerodha.com",
  groww: "groww.in",
  postman: "postman.com",
  browserstack: "browserstack.com",
  freshworks: "freshworks.com",
  zoho: "zoho.com",
  inmobi: "inmobi.com",
  hasura: "hasura.io",
  zepto: "zeptonow.com",
  blinkit: "blinkit.com",
  bigbasket: "bigbasket.com",
  myntra: "myntra.com",
  nykaa: "nykaa.com",
  meesho: "meesho.com",
  cult: "cult.fit",
  "cult.fit": "cult.fit",
  "cure.fit": "cult.fit",
  starbucks: "starbucks.com",
  "third wave": "thirdwavecoffeeroasters.com",
  "blue tokai": "bluetokaicoffee.com",
  "cafe coffee day": "cafecoffeeday.com",
  manipal: "manipalhospitals.com",
  apollo: "apollohospitals.com",
  fortis: "fortishealthcare.com",
  narayana: "narayanahealth.org",
  hrudayalaya: "narayanahealth.org",
  euroschool: "euroschoolindia.com",
  aster: "asterhospitals.in",
  cloudnine: "cloudninecare.com",
  "sakra world": "sakraworldhospital.com",
  decathlon: "decathlon.in",
  ikea: "ikea.com",
  zara: "zara.com",
  "h&m": "hm.com",
  nike: "nike.com",
  adidas: "adidas.com",
  puma: "puma.com",
  hdfc: "hdfcbank.com",
  icici: "icicibank.com",
  sbi: "sbi.co.in",
  "state bank": "sbi.co.in",
  axis: "axisbank.com",
  kotak: "kotak.com",
  cisco: "cisco.com",
  intel: "intel.com",
  nvidia: "nvidia.com",
  amd: "amd.com",
  qualcomm: "qualcomm.com",
  oracle: "oracle.com",
  sap: "sap.com",
  salesforce: "salesforce.com",
  servicenow: "servicenow.com",
  adobe: "adobe.com",
  dell: "dell.com",
  hp: "hp.com",
  lenovo: "lenovo.com",
  bosch: "bosch.in",
  siemens: "siemens.com",
  honeywell: "honeywell.com",
  schneider: "se.com",
  abb: "abb.com",
  deloitte: "deloitte.com",
  pwc: "pwc.com",
  ey: "ey.com",
  kpmg: "kpmg.com",
  mckinsey: "mckinsey.com",
  bcg: "bcg.com",
  bain: "bain.com",
  goldman: "goldmansachs.com",
  "morgan stanley": "morganstanley.com",
  "jp morgan": "jpmorgan.com",
};

export function getCompanyCategoryIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("security") || t.includes("cyber") || t.includes("guard") || t.includes("shield") || t.includes("vault")) return "🛡️";
  if (t.includes("ai") || t.includes("genai") || t.includes("intelligence") || t.includes("neural") || t.includes("deep learning") || t.includes("cognitive") || t.includes("vision")) return "🤖";
  if (t.includes("cloud") || t.includes("devops") || t.includes("infra") || t.includes("node") || t.includes("server") || t.includes("hyper") || t.includes("nexus")) return "☁️";
  if (t.includes("pay") || t.includes("fintech") || t.includes("capital") || t.includes("finance") || t.includes("bank") || t.includes("credit") || t.includes("wallet")) return "💳";
  if (t.includes("health") || t.includes("hospital") || t.includes("clinic") || t.includes("care") || t.includes("bio") || t.includes("pharma") || t.includes("dental") || t.includes("eye")) return "🩺";
  if (t.includes("data") || t.includes("analytics") || t.includes("matrix") || t.includes("lake") || t.includes("spark") || t.includes("stratum") || t.includes("pulse")) return "📊";
  if (t.includes("space") || t.includes("orbit") || t.includes("satellite") || t.includes("geo") || t.includes("aero") || t.includes("quantum")) return "🚀";
  if (t.includes("electric") || t.includes("energy") || t.includes("power") || t.includes("battery") || t.includes("cleantech") || t.includes("solar")) return "⚡";
  if (t.includes("school") || t.includes("academy") || t.includes("education") || t.includes("edtech") || t.includes("learn") || t.includes("college") || t.includes("institute")) return "🎓";
  if (t.includes("robot") || t.includes("hardware") || t.includes("iot") || t.includes("sensor") || t.includes("semiconductor") || t.includes("vanguard") || t.includes("synapse")) return "⚙️";
  if (t.includes("shop") || t.includes("retail") || t.includes("commerce") || t.includes("mart") || t.includes("market") || t.includes("store")) return "🛍️";
  if (t.includes("cafe") || t.includes("coffee") || t.includes("restaurant") || t.includes("food") || t.includes("bake") || t.includes("dine")) return "☕";
  if (t.includes("hotel") || t.includes("stay") || t.includes("resort")) return "🏨";
  return "💻";
}

export function getCompanyDomain(website?: string | null, title?: string): string {
  // 1. Check title against known enterprise brand dictionary
  if (title) {
    const lowerTitle = title.toLowerCase();
    for (const [key, domain] of Object.entries(KNOWN_BRAND_DOMAINS)) {
      if (lowerTitle.includes(key)) {
        return domain;
      }
    }
  }

  // 2. Extract from website URL if available
  if (website) {
    try {
      const urlStr = website.startsWith("http") ? website : `https://${website}`;
      const parsed = new URL(urlStr);
      const host = parsed.hostname.replace(/^www\./, "");
      if (host && !host.includes("localhost") && host.includes(".")) {
        return host;
      }
    } catch {
      const clean = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      if (clean && clean.includes(".")) return clean;
    }
  }

  // If no known brand or verified website exists, do not guess arbitrary .com domains
  // to avoid triggering 404 network errors from external favicon proxies.
  return "";
}

export function getCompanyLogoUrl(website?: string | null, title?: string): string {
  const domain = getCompanyDomain(website, title);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function getCompanyInitials(title: string): string {
  const cleanTitle = title
    .replace(/\b(Pvt|Ltd|Limited|Technologies|Tech|Labs|Hospital|School|Cafe)\b/gi, "")
    .trim();
  const words = cleanTitle.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

const BRAND_GRADIENTS = [
  "from-indigo-600 to-violet-700 text-white",
  "from-blue-600 to-indigo-700 text-white",
  "from-teal-600 to-emerald-700 text-white",
  "from-rose-600 to-pink-700 text-white",
  "from-amber-500 to-orange-600 text-white",
  "from-purple-600 to-fuchsia-700 text-white",
  "from-cyan-600 to-blue-700 text-white",
  "from-slate-700 to-slate-900 text-white",
];

export function CompanyBrandAvatar({
  title,
  website,
  size = 40,
  className = "",
}: {
  title: string;
  website?: string | null;
  size?: number;
  className?: string;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const domain = getCompanyDomain(website, title);
  const techIcon = getCompanyCategoryIcon(title);

  // Consistent color gradient based on place title
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = BRAND_GRADIENTS[hash % BRAND_GRADIENTS.length];

  // Cascading logo sources
  const logoSources = domain
    ? [
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
        `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`,
      ]
    : [];

  const currentSrc = logoSources[sourceIndex];

  if (!currentSrc || sourceIndex >= logoSources.length) {
    return (
      <div
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-xs shrink-0 select-none overflow-hidden ${className}`}
      >
        <span style={{ fontSize: size * 0.48 }} className="leading-none drop-shadow-xs">
          {techIcon}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className={`relative flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs p-1.5 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src={currentSrc}
        alt={title}
        width={size - 8}
        height={size - 8}
        loading="lazy"
        className="h-full w-full object-contain rounded-lg"
        onError={() => setSourceIndex((prev) => prev + 1)}
      />
    </div>
  );
}
