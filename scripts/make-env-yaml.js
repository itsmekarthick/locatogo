const fs = require('fs');

if (!fs.existsSync('.env')) {
  console.error('.env file not found.');
  process.exit(1);
}

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split(/\r?\n/);
const out = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const k = trimmed.slice(0, idx).trim();
  let v = trimmed.slice(idx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  out.push(`${k}: ${JSON.stringify(v)}`);
}

fs.writeFileSync('.env.yaml', out.join('\n') + '\n', 'utf8');
console.log(`Generated .env.yaml with ${out.length} variables.`);
