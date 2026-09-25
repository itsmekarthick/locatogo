export {};

async function inspectSimplify() {
  const res = await fetch("https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md");
  const text = await res.text();
  const lines = text.split("\n");
  console.log(lines.slice(100, 140).join("\n"));
}
inspectSimplify();
