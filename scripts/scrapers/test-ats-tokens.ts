// Node 22 native fetch

async function test() {
  const tests = [
    { name: "Postman Ashby", url: "https://api.ashbyhq.com/posting-api/job-board/postman" },
    { name: "Atlan Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/atlan/jobs" },
    { name: "Zepto Lever", url: "https://api.lever.co/v0/postings/zeptonow" },
    { name: "Zepto Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/zepto/jobs" },
    { name: "Hasura Lever", url: "https://api.lever.co/v0/postings/hasura" },
    { name: "Hasura Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/hasura/jobs" },
    { name: "Appsmith Ashby", url: "https://api.ashbyhq.com/posting-api/job-board/appsmith" },
    { name: "Sarvam Ashby", url: "https://api.ashbyhq.com/posting-api/job-board/sarvam" },
    { name: "Pixxel Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/pixxel/jobs" },
    { name: "Pixxel Lever", url: "https://api.lever.co/v0/postings/pixxel" },
    { name: "Jupiter Lever", url: "https://api.lever.co/v0/postings/jupiter" },
    { name: "Razorpay Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/razorpay/jobs" },
    { name: "CRED Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/cred/jobs" },
    { name: "CRED Lever", url: "https://api.lever.co/v0/postings/cred" },
    { name: "Flipkart", url: "https://www.flipkartcareers.com" },
    { name: "Swiggy", url: "https://careers.swiggy.com" },
    { name: "Zerodha", url: "https://zerodha.com/careers" },
  ];

  for (const t of tests) {
    try {
      const res = await fetch(t.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      console.log(`${t.name}: status ${res.status} (${res.headers.get("content-type")})`);
    } catch (e: any) {
      console.log(`${t.name}: ERROR ${e.message}`);
    }
  }
}

test();
