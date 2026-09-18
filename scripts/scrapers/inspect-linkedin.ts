import fs from "fs";

async function inspect() {
  const url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Software%20Engineer&location=Bengaluru%2C%20Karnataka%2C%20India&start=0";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  console.log("HTML length:", html.length);
  fs.writeFileSync("scripts/scrapers/sample-linkedin.html", html);
  console.log("Saved to sample-linkedin.html");
}

inspect().catch(console.error);
