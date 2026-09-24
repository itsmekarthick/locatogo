export {};

async function testWikidata() {
  // Query tech/software companies in San Francisco (Q62)
  const sparql = `
    SELECT ?company ?companyLabel ?website WHERE {
      ?company wdt:P31/wdt:P279* wd:Q4830453 ; # business enterprise
               wdt:P159 wd:Q62 .              # HQ in San Francisco
      OPTIONAL { ?company wdt:P856 ?website . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 20
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LocaToGoAtlas/1.0 (contact: admin@locatogo.com)",
        "Accept": "application/sparql-results+json",
      },
    });
    const data = await res.json();
    console.log("Wikidata results count:", data.results?.bindings?.length);
    if (data.results?.bindings?.length > 0) {
      console.log("Sample companies:", data.results.bindings.slice(0, 5).map((b: any) => ({
        name: b.companyLabel?.value,
        website: b.website?.value,
      })));
    }
  } catch (err: any) {
    console.log("Wikidata error:", err.message);
  }
}

testWikidata();
