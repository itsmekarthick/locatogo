/**
 * test-additional-providers.ts
 */

async function testWorkable(token: string) {
  try {
    const res = await fetch(`https://apply.workable.com/api/v3/accounts/${token}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mapora-Tech-Atlas/1.0" },
      body: JSON.stringify({ query: "" }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.results?.length ?? null;
  } catch {
    return null;
  }
}

async function testRecruitee(token: string) {
  try {
    const res = await fetch(`https://${token}.recruitee.com/api/offers/`, {
      headers: { "User-Agent": "Mapora-Tech-Atlas/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.offers?.length ?? null;
  } catch {
    return null;
  }
}

async function testBreezy(token: string) {
  try {
    const res = await fetch(`https://${token}.breezy.hr/json`, {
      headers: { "User-Agent": "Mapora-Tech-Atlas/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json) ? json.length : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("Testing Workable with 'clevertap' or others...");
  const wk = await testWorkable("clevertap");
  console.log("Workable clevertap:", wk);

  console.log("Testing Workable with 'khatabook'...");
  console.log("Workable khatabook:", await testWorkable("khatabook"));

  console.log("Testing Breezy with 'hasura'...");
  console.log("Breezy hasura:", await testBreezy("hasura"));
}

main().catch(console.error);
