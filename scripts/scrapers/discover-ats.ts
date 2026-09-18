async function checkTokens() {
  const candidates: Array<{ name: string; urls: string[] }> = [
    {
      name: "Postman",
      urls: [
        "https://api.ashbyhq.com/posting-api/job-board/postman",
        "https://boards-api.greenhouse.io/v1/boards/postman/jobs",
        "https://api.lever.co/v0/postings/postman",
        "https://api.lever.co/v0/postings/getpostman",
        "https://api.ashbyhq.com/posting-api/job-board/getpostman",
      ],
    },
    {
      name: "Atlan",
      urls: [
        "https://boards-api.greenhouse.io/v1/boards/atlan/jobs",
        "https://boards-api.greenhouse.io/v1/boards/atlanhq/jobs",
        "https://api.lever.co/v0/postings/atlan",
        "https://api.lever.co/v0/postings/atlanhq",
      ],
    },
    {
      name: "Appsmith",
      urls: [
        "https://api.ashbyhq.com/posting-api/job-board/appsmith",
        "https://api.lever.co/v0/postings/appsmith",
        "https://boards-api.greenhouse.io/v1/boards/appsmith/jobs",
      ],
    },
    {
      name: "Hasura",
      urls: [
        "https://api.lever.co/v0/postings/hasura",
        "https://boards-api.greenhouse.io/v1/boards/hasura/jobs",
        "https://api.ashbyhq.com/posting-api/job-board/hasura",
      ],
    },
    {
      name: "Razorpay",
      urls: [
        "https://boards-api.greenhouse.io/v1/boards/razorpay/jobs",
        "https://boards-api.greenhouse.io/v1/boards/razorpaysoftware/jobs",
        "https://api.lever.co/v0/postings/razorpay",
      ],
    },
    {
      name: "Zepto",
      urls: [
        "https://api.lever.co/v0/postings/zepto",
        "https://api.lever.co/v0/postings/zeptonow",
        "https://boards-api.greenhouse.io/v1/boards/zepto/jobs",
        "https://boards-api.greenhouse.io/v1/boards/zeptonow/jobs",
      ],
    },
    {
      name: "Jupiter",
      urls: [
        "https://api.lever.co/v0/postings/jupiter",
        "https://api.lever.co/v0/postings/jupitermoney",
        "https://boards-api.greenhouse.io/v1/boards/jupiter/jobs",
      ],
    },
    {
      name: "Pixxel",
      urls: [
        "https://boards-api.greenhouse.io/v1/boards/pixxel/jobs",
        "https://boards-api.greenhouse.io/v1/boards/pixxelspace/jobs",
        "https://api.lever.co/v0/postings/pixxel",
        "https://api.ashbyhq.com/posting-api/job-board/pixxel",
      ],
    },
    {
      name: "Udaan",
      urls: [
        "https://api.lever.co/v0/postings/udaan",
        "https://api.lever.co/v0/postings/udaancom",
        "https://boards-api.greenhouse.io/v1/boards/udaan/jobs",
      ],
    },
    {
      name: "Licious",
      urls: [
        "https://api.lever.co/v0/postings/licious",
        "https://boards-api.greenhouse.io/v1/boards/licious/jobs",
        "https://boards-api.greenhouse.io/v1/boards/delightfulgourmet/jobs",
      ],
    },
    {
      name: "Sprinto",
      urls: [
        "https://api.lever.co/v0/postings/sprinto",
        "https://boards-api.greenhouse.io/v1/boards/sprinto/jobs",
        "https://api.ashbyhq.com/posting-api/job-board/sprinto",
      ],
    },
    {
      name: "Scrut",
      urls: [
        "https://api.lever.co/v0/postings/scrut",
        "https://api.lever.co/v0/postings/scrutautomation",
        "https://boards-api.greenhouse.io/v1/boards/scrut/jobs",
      ],
    },
    {
      name: "Toddle",
      urls: [
        "https://api.lever.co/v0/postings/toddle",
        "https://api.lever.co/v0/postings/toddleapp",
        "https://boards-api.greenhouse.io/v1/boards/toddle/jobs",
      ],
    },
    {
      name: "Drip Capital",
      urls: [
        "https://api.lever.co/v0/postings/dripcapital",
        "https://boards-api.greenhouse.io/v1/boards/dripcapital/jobs",
      ],
    },
    {
      name: "CoinDCX",
      urls: [
        "https://api.lever.co/v0/postings/coindcx",
        "https://boards-api.greenhouse.io/v1/boards/coindcx/jobs",
      ],
    },
    {
      name: "CoinSwitch",
      urls: [
        "https://api.lever.co/v0/postings/coinswitch",
        "https://boards-api.greenhouse.io/v1/boards/coinswitch/jobs",
        "https://boards-api.greenhouse.io/v1/boards/coinswitchkuber/jobs",
      ],
    },
    {
      name: "Khatabook",
      urls: [
        "https://api.lever.co/v0/postings/khatabook",
        "https://boards-api.greenhouse.io/v1/boards/khatabook/jobs",
      ],
    },
    {
      name: "Darwinbox",
      urls: [
        "https://api.lever.co/v0/postings/darwinbox",
        "https://boards-api.greenhouse.io/v1/boards/darwinbox/jobs",
      ],
    },
    {
      name: "Yellow.ai",
      urls: [
        "https://api.lever.co/v0/postings/yellowai",
        "https://boards-api.greenhouse.io/v1/boards/yellowai/jobs",
        "https://boards-api.greenhouse.io/v1/boards/yellowmessenger/jobs",
      ],
    },
    {
      name: "Ather Energy",
      urls: [
        "https://api.lever.co/v0/postings/atherenergy",
        "https://boards-api.greenhouse.io/v1/boards/atherenergy/jobs",
      ],
    },
  ];

  for (const c of candidates) {
    for (const u of c.urls) {
      try {
        const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (res.ok) {
          console.log(`🎯 FOUND: ${c.name} -> ${u} (status ${res.status})`);
          break;
        }
      } catch {}
    }
  }
}

checkTokens();
