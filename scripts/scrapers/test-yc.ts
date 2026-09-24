export {};

async function testYC() {
  const url = "https://45bwzj1sgc-dsn.algolia.net/1/indexes/YCCompany_production/query";
  const body = {
    params: "query=San%20Francisco&hitsPerPage=20"
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": "45BWZJ1SGC",
        "X-Algolia-API-Key": "d6e76679da01750b4cf230a13ea2b251", // public YC key used on ycombinator.com/companies
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.slice(0, 300));
  } catch (e: any) {
    console.log("YC fetch error:", e.message);
  }
}

testYC();
