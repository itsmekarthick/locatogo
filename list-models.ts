import * as fs from "fs";

const env: Record<string, string> = {};
fs.readFileSync(".env.local", "utf8").split(/\r?\n/).forEach((line) => {
  const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
});

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`)
  .then(r => r.json())
  .then(j => {
    console.log(j);
    if (j.models) {
      fs.writeFileSync("models.txt", j.models.map((m: any) => m.name).join("\n"));
    } else {
      fs.writeFileSync("models.txt", JSON.stringify(j));
    }
  })
  .catch(console.error);
