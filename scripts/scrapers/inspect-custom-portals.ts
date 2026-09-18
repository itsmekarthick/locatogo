const PORTALS = [
  { name: "CRED", url: "https://careers.cred.club" },
  { name: "Razorpay", url: "https://razorpay.com/jobs" },
  { name: "Postman", url: "https://www.postman.com/company/careers" },
  { name: "Ather", url: "https://www.atherenergy.com/careers" },
  { name: "Zerodha", url: "https://zerodha.com/careers" },
  { name: "Swiggy", url: "https://careers.swiggy.com" },
  { name: "Flipkart", url: "https://www.flipkartcareers.com" },
  { name: "Zepto", url: "https://zepto.com/careers" },
  { name: "Hasura", url: "https://hasura.io/careers" },
  { name: "Atlan", url: "https://atlan.com/careers" },
  { name: "Appsmith", url: "https://www.appsmith.com/careers" },
  { name: "Licious", url: "https://www.licious.in/careers" },
  { name: "ClearTax", url: "https://clear.in/careers" },
  { name: "Jupiter", url: "https://jupiter.money/careers" },
  { name: "Jar", url: "https://www.myjar.app/careers" },
];

async function run() {
  console.log("Inspecting custom portals for embedded ATS links and job content...\n");

  for (const p of PORTALS) {
    try {
      const res = await fetch(p.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml",
        },
        signal: AbortSignal.timeout(10_000),
      });

      const html = await res.text();

      // Look for greenhouse, lever, ashby, workable, bamboohr, workday, smartrecruiters
      const atsMatches = [
        ...html.matchAll(/(https?:\/\/[^"'\s<>]+(?:greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|bamboohr\.com|myworkdayjobs\.com|smartrecruiters\.com|freshteam\.com|darwinbox\.in|recruitee\.com)[^"'\s<>]*)/gi),
      ].map((m) => m[1]);

      const uniqueAts = [...new Set(atsMatches)];

      // Look for JSON-LD
      const hasJsonLd = html.includes("application/ld+json");
      const jobPostingMatch = html.includes("JobPosting");

      console.log(`📌 ${p.name} (${p.url}): status ${res.status}`);
      if (uniqueAts.length > 0) {
        console.log(`   ATS links found:`, uniqueAts.slice(0, 3));
      } else {
        console.log(`   No direct ATS links in static HTML. (hasJsonLd: ${hasJsonLd}, JobPosting: ${jobPostingMatch})`);
      }
    } catch (e: any) {
      console.log(`❌ ${p.name}: ${e.message}`);
    }
  }
}

run();
