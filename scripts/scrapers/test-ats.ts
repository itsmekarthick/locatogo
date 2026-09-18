async function testATS() {
  const greenhouseCompanies = ["postman", "hasura", "browserstack", "razorpay", "meesho", "cred", "swiggy", "groww", "inmobi", "whatfix"];
  console.log("Testing Greenhouse public boards...");
  for (const comp of greenhouseCompanies) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${comp}/jobs`);
      if (res.ok) {
        const data = await res.json();
        const blrJobs = (data.jobs || []).filter((j: any) => 
          (j.location?.name || "").toLowerCase().includes("bengaluru") ||
          (j.location?.name || "").toLowerCase().includes("bangalore") ||
          (j.location?.name || "").toLowerCase().includes("india")
        );
        console.log(`[Greenhouse] ${comp}: ${data.jobs?.length} total jobs, ${blrJobs.length} in Bangalore/India`);
      } else {
        console.log(`[Greenhouse] ${comp}: status ${res.status}`);
      }
    } catch (e: any) {
      console.log(`[Greenhouse] ${comp}: error ${e.message}`);
    }
  }

  const leverCompanies = ["postman", "hasura", "browserstack", "razorpay", "meesho", "cred", "swiggy", "groww", "inmobi", "whatfix", "zepto", "atherenergy"];
  console.log("\nTesting Lever public postings...");
  for (const comp of leverCompanies) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${comp}?mode=json`);
      if (res.ok) {
        const data = await res.json();
        const blrJobs = (data || []).filter((j: any) =>
          (j.categories?.location || "").toLowerCase().includes("bengaluru") ||
          (j.categories?.location || "").toLowerCase().includes("bangalore") ||
          (j.categories?.location || "").toLowerCase().includes("india")
        );
        console.log(`[Lever] ${comp}: ${data.length} total jobs, ${blrJobs.length} in Bangalore/India`);
      } else {
        console.log(`[Lever] ${comp}: status ${res.status}`);
      }
    } catch (e: any) {
      console.log(`[Lever] ${comp}: error ${e.message}`);
    }
  }
}

testATS().catch(console.error);
