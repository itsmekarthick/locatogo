import { detectBoard, fetchJobs } from "../../src/lib/jobs/providers";

async function probe() {
  const tests = [
    "https://jobs.lever.co/anthropic",
    "https://boards.greenhouse.io/anthropic",
    "https://jobs.lever.co/stripe",
    "https://boards.greenhouse.io/stripe",
    "https://boards.greenhouse.io/airbnb",
    "https://jobs.lever.co/postman",
    "https://jobs.lever.co/hasura",
    "https://boards.greenhouse.io/razorpay",
    "https://boards.greenhouse.io/browserstack",
    "https://boards.greenhouse.io/uber",
    "https://jobs.lever.co/uber",
  ];
  for (const t of tests) {
    const b = detectBoard(t);
    if (!b) continue;
    try {
      const res = await fetchJobs(b);
      console.log(`FOUND: ${t} -> ${res.length} jobs`);
    } catch {}
  }
}
probe();
