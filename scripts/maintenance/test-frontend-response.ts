async function main() {
  const res = await fetch("http://localhost:3000/");
  console.log("Status:", res.status);
  const html = await res.text();
  console.log("HTML length:", html.length);
  console.log("Contains Amazon Development Center:", html.includes("Amazon Development Center"));
  console.log("Contains Microsoft India Development Center:", html.includes("Microsoft India Development Center"));
  console.log("Contains ServiceNow India (Hyderabad):", html.includes("ServiceNow India (Hyderabad)"));
  console.log("Contains HighRadius:", html.includes("HighRadius"));
  console.log("Contains Darwinbox:", html.includes("Darwinbox"));
  console.log("Contains Skyroot Aerospace:", html.includes("Skyroot Aerospace"));
  console.log("Contains Swiggy:", html.includes("Swiggy"));
}

main().catch(console.error);
