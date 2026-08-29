import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
const content = fs.readFileSync(envPath, "utf-8");
console.log("Keys in .env:");
for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const key = trimmed.split("=")[0].trim();
    console.log(" -", key);
  }
}

