import { detectBoard, fetchJobs } from "../../src/lib/jobs/providers";

const candidates = [
  { name: "Zepto-ashby", url: "https://jobs.ashbyhq.com/zepto" },
  { name: "Zepto-ashby2", url: "https://jobs.ashbyhq.com/zeptonow" },
  { name: "Dream11-ashby", url: "https://jobs.ashbyhq.com/dream11" },
  { name: "Dream11-lever", url: "https://jobs.lever.co/dreamsports" },
  { name: "Dream11-gh", url: "https://boards.greenhouse.io/dream11" },
  { name: "Zomato-ashby", url: "https://jobs.ashbyhq.com/zomato" },
  { name: "Zomato-lever", url: "https://jobs.lever.co/zomato" },
  { name: "Blinkit-ashby", url: "https://jobs.ashbyhq.com/blinkit" },
  { name: "Blinkit-lever", url: "https://jobs.lever.co/blinkit" },
  { name: "UrbanCompany-ashby", url: "https://jobs.ashbyhq.com/urbancompany" },
  { name: "UrbanCompany-lever", url: "https://jobs.lever.co/urbancompany" },
  { name: "Cars24-ashby", url: "https://jobs.ashbyhq.com/cars24" },
  { name: "Cars24-lever", url: "https://jobs.lever.co/cars24" },
  { name: "Shiprocket-ashby", url: "https://jobs.ashbyhq.com/shiprocket" },
  { name: "Shiprocket-gh", url: "https://boards.greenhouse.io/shiprocket" },
  { name: "BharatPe-ashby", url: "https://jobs.ashbyhq.com/bharatpe" },
  { name: "PineLabs-ashby", url: "https://jobs.ashbyhq.com/pinelabs" },
  { name: "PineLabs-lever", url: "https://jobs.lever.co/pinelabs" },
  { name: "BrowserStack-ashby", url: "https://jobs.ashbyhq.com/browserstack" },
  { name: "BrowserStack-gh", url: "https://boards.greenhouse.io/browserstack" },
  { name: "CleverTap-ashby", url: "https://jobs.ashbyhq.com/clevertap" },
  { name: "CleverTap-gh", url: "https://boards.greenhouse.io/clevertap" },
  { name: "CleverTap-lever", url: "https://jobs.lever.co/clevertap" },
  { name: "Chargebee-gh", url: "https://boards.greenhouse.io/chargebee" },
  { name: "Chargebee-ashby", url: "https://jobs.ashbyhq.com/chargebee" },
  { name: "Kissflow-gh", url: "https://boards.greenhouse.io/kissflow" },
  { name: "Kissflow-ashby", url: "https://jobs.ashbyhq.com/kissflow" },
  { name: "CareStack-ashby", url: "https://jobs.ashbyhq.com/carestack" },
  { name: "CareStack-lever", url: "https://jobs.lever.co/goodmethodsglobal" },
  { name: "SurveySparrow-ashby", url: "https://jobs.ashbyhq.com/surveysparrow" },
  { name: "Nagarro-sr", url: "https://careers.smartrecruiters.com/nagarro" },
  { name: "Icertis-gh", url: "https://boards.greenhouse.io/icertis" },
  { name: "Icertis-sr", url: "https://careers.smartrecruiters.com/icertis" },
  { name: "Capgemini-sr", url: "https://careers.smartrecruiters.com/capgemini" },
  { name: "Cognizant-sr", url: "https://careers.smartrecruiters.com/cognizant" },
  { name: "UST-sr", url: "https://careers.smartrecruiters.com/ust" },
  { name: "TataElxsi-sr", url: "https://careers.smartrecruiters.com/tataelxsi" },
  { name: "TataTechnologies-sr", url: "https://careers.smartrecruiters.com/tatatechnologies" },
];

async function run() {
  console.log("Testing candidate ATS URLs batch 2...\n");
  for (const c of candidates) {
    const board = detectBoard(c.url);
    if (!board) continue;
    try {
      const jobs = await fetchJobs(board);
      if (jobs && jobs.length > 0) {
        console.log(`✅ SUCCESS: ${c.name.padEnd(22)} [${board.provider}] => ${jobs.length} jobs! (${c.url})`);
      }
    } catch {
      // 404
    }
  }
}

run();
