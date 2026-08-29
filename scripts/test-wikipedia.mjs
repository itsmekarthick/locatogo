async function testWiki(title) {
  console.log(`\nTesting Wikimedia photo for: "${title}"`);
  const cleanTitle = title.replace(/\s+(Bangalore|Bengaluru|Chandapura|Indiranagar|Koramangala)/gi, "").trim();
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=pageimages&pithumbsize=1000&format=json&origin=*`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const pageKey = Object.keys(pages)[0];
      if (pageKey && pageKey !== "-1" && pages[pageKey]?.thumbnail?.source) {
        console.log("Found Wiki Photo:", pages[pageKey].thumbnail.source);
        return;
      }
    }
    console.log("No exact Wikipedia article found.");
  } catch (err) {
    console.error(err);
  }
}

testWiki("Bangalore Palace");
testWiki("Vidhana Soudha");
testWiki("Lalbagh Botanical Garden");
testWiki("Truffles Koramangala");

