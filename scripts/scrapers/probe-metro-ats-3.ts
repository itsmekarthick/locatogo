import { detectBoard, fetchJobs } from "../../src/lib/jobs/providers";

const candidates = [
  { name: "Thoughtworks", url: "https://boards.greenhouse.io/thoughtworks" },
  { name: "Bosch", url: "https://careers.smartrecruiters.com/boschgroup" },
  { name: "Schneider", url: "https://careers.smartrecruiters.com/schneiderelectric" },
  { name: "Siemens", url: "https://careers.smartrecruiters.com/siemens" },
  { name: "Societe Generale", url: "https://careers.smartrecruiters.com/societegenerale" },
  { name: "Nagarro", url: "https://careers.smartrecruiters.com/Nagarro" },
  { name: "BrowserStack Inc", url: "https://boards.greenhouse.io/browserstackinc" },
  { name: "CleverTap Inc", url: "https://boards.greenhouse.io/clevertapinc" },
  { name: "Zomato India", url: "https://boards.greenhouse.io/zomatoindia" },
  { name: "Chargebee Inc", url: "https://boards.greenhouse.io/chargebeeinc" },
  { name: "Kissflow Inc", url: "https://boards.greenhouse.io/kissflowinc" },
  { name: "Persistent Inc", url: "https://boards.greenhouse.io/persistentsystems" },
  { name: "FirstCry", url: "https://boards.greenhouse.io/firstcry" },
  { name: "UST Global", url: "https://boards.greenhouse.io/ustglobal" },
  { name: "Tata", url: "https://careers.smartrecruiters.com/tata" },
];

async function run() {
  for (const c of candidates) {
    const board = detectBoard(c.url);
    if (!board) continue;
    try {
      const jobs = await fetchJobs(board);
      if (jobs && jobs.length > 0) {
        console.log(`✅ SUCCESS: ${c.name.padEnd(20)} [${board.provider}] => ${jobs.length} jobs! (${c.url})`);
      }
    } catch {}
  }
}

run();
