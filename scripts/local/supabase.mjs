import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const privateDirectory = path.join(root, ".local-supabase");
const snapshotPath = path.join(privateDirectory, "snapshot.json");
const container = "supabase_db_locatogo";
fs.mkdirSync(privateDirectory, { recursive: true });

function sql(statement) {
  const result = spawnSync("docker", ["exec", "-i", container, "psql", "-X", "-U", "postgres", "-d", "postgres", "--set", "ON_ERROR_STOP=1", "--quiet", "--tuples-only", "--no-align"], {
    input: `SET client_encoding = 'UTF8';\n${statement}\n`,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr);
  return result.stdout.trim();
}

function identifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`Invalid identifier: ${value}`);
  return `"${value}"`;
}

function decodeToolFile(filePath) {
  let value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (typeof value.result === "string") {
    const match = value.result.match(/(?:^|\n)[ \t]*<untrusted-data-[^>]+>\r?\n([\s\S]*?)\r?\n[ \t]*<\/untrusted-data-[^>]+>/);
    if (!match) throw new Error("SQL result envelope not found.");
    value = JSON.parse(match[1]);
  }
  if (!Array.isArray(value) || !value[0]?.tables) throw new Error("Expected a tables snapshot.");
  return value[0].tables;
}

function stage(files) {
  const tables = fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath, "utf8")).tables : {};
  for (const filePath of files) {
    const incoming = decodeToolFile(filePath);
    for (const [table, rows] of Object.entries(incoming)) {
      if (!Array.isArray(rows)) throw new Error(`Invalid rows for ${table}`);
      tables[table] = [...(tables[table] || []), ...rows];
      console.log(`Staged ${table}: ${rows.length} rows`);
    }
  }
  fs.writeFileSync(snapshotPath, JSON.stringify({ capturedAt: new Date().toISOString(), tables }), "utf8");
}

function readSnapshot() {
  return JSON.parse(fs.readFileSync(snapshotPath, "utf8")).tables;
}

function insertRows(table, rows) {
  if (!rows.length) return "";
  const [schema, name] = table.split(".");
  if (!["public", "auth"].includes(schema)) throw new Error(`Unsupported schema: ${schema}`);
  const metadata = JSON.parse(sql(`SELECT coalesce(json_agg(json_build_object('name', column_name, 'generated', is_generated)), '[]') FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = '${name}';`));
  const sourceColumns = Object.keys(rows[0]);
  const unknown = sourceColumns.filter((column) => !metadata.some((entry) => entry.name === column));
  if (unknown.length) throw new Error(`Schema mismatch in ${table}: ${unknown.join(", ")}`);
  const columns = sourceColumns.filter((column) => metadata.find((entry) => entry.name === column)?.generated !== "ALWAYS");
  const columnList = columns.map(identifier).join(", ");
  const qualified = `${identifier(schema)}.${identifier(name)}`;
  const delimiter = `$snapshot_${randomUUID().replaceAll("-", "")}$`;
  return `INSERT INTO ${qualified} (${columnList}) OVERRIDING SYSTEM VALUE SELECT ${columnList} FROM json_populate_recordset(NULL::${qualified}, ${delimiter}${JSON.stringify(rows)}${delimiter}::json);`;
}

function bootstrap() {
  const tables = readSnapshot();
  sql("CREATE SCHEMA IF NOT EXISTS supabase_migrations; CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);");
  const applied = new Set(sql("SELECT version FROM supabase_migrations.schema_migrations;").split("\n"));
  const directory = path.join(root, "supabase", "migrations");
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort()) {
    const version = file.split("_")[0];
    if (applied.has(version)) continue;
    console.log(`Applying local migration ${file}`);
    const statement = fs.readFileSync(path.join(directory, file), "utf8");
    const name = file.slice(version.length + 1, -4).replaceAll("'", "''");
    sql(`BEGIN;\n${statement}\nINSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('${version}', '${name}', ARRAY[]::text[]);\nCOMMIT;`);
    if (version === "202608270001") {
      const tenants = tables["public.tenants"].map(({ id, name, slug, status, created_at, updated_at }) => ({ id, name, slug, status, created_at, updated_at }));
      sql(`BEGIN; ${insertRows("public.tenants", tenants)} COMMIT;`);
    }
  }
}

function restore() {
  const tables = readSnapshot();
  const expected = JSON.parse(sql("SELECT coalesce(json_agg('public.' || tablename), '[]') FROM pg_tables WHERE schemaname = 'public';"));
  for (const table of [...expected, "auth.users", "auth.identities"]) {
    if (!tables[table]) throw new Error(`Snapshot missing ${table}; refusing partial restore.`);
  }
  const cleanup = `DO $$ DECLARE table_list text; BEGIN SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO table_list FROM pg_tables WHERE schemaname = 'public'; IF table_list IS NOT NULL THEN EXECUTE 'TRUNCATE TABLE ' || table_list || ' RESTART IDENTITY CASCADE'; END IF; END $$; TRUNCATE auth.users CASCADE;`;
  const statements = ["BEGIN;", cleanup, "SET LOCAL session_replication_role = replica;"];
  for (const table of ["auth.users", "auth.identities", ...expected]) {
    statements.push(insertRows(table, tables[table]));
  }
  statements.push("SET LOCAL session_replication_role = origin; COMMIT;");
  sql(statements.join("\n"));
  sql("ANALYZE; NOTIFY pgrst, 'reload schema';");
  for (const [table, rows] of Object.entries(tables)) {
    const [schema, name] = table.split(".");
    const count = Number(sql(`SELECT count(*) FROM ${identifier(schema)}.${identifier(name)};`));
    if (count !== rows.length) throw new Error(`Count mismatch for ${table}: ${count} != ${rows.length}`);
    console.log(`Verified ${table}: ${count} rows`);
  }
}

function localStatus() {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, ["--yes", "supabase", "status", "--output", "json"], { encoding: "utf8", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error("Unable to read local Supabase status.");
  const status = JSON.parse(result.stdout);
  if (new URL(status.API_URL).hostname !== "127.0.0.1") throw new Error("Refusing non-local API URL.");
  return status;
}

function configure() {
  const status = localStatus();
  const environmentPath = path.join(root, ".env.local");
  const backupPath = path.join(privateDirectory, "cloud.env.local");
  if (fs.existsSync(environmentPath) && !fs.existsSync(backupPath)) fs.copyFileSync(environmentPath, backupPath);
  let text = fs.existsSync(environmentPath) ? fs.readFileSync(environmentPath, "utf8") : "";
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const values = {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    RESEND_API_KEY: "",
  };
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) throw new Error(`Local credential missing: ${key}`);
    const pattern = new RegExp(`^${key}=[^\\r\\n]*`, "m");
    text = pattern.test(text) ? text.replace(pattern, () => `${key}=${value}`) : `${text}${text.endsWith("\n") || !text ? "" : newline}${key}=${value}${newline}`;
  }
  fs.writeFileSync(environmentPath, text, "utf8");
  console.log(`App configured for ${status.API_URL}; original environment backed up privately.`);
}

async function verifyLogin(email) {
  const status = localStatus();
  const tables = readSnapshot();
  const user = tables["auth.users"].find((entry) => entry.email === email);
  if (!user) throw new Error("Requested account not found in the snapshot.");
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const password = `Local-${randomUUID()}`;
  const credentialsPath = path.join(privateDirectory, "login.txt");
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
  const client = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error: loginError } = await client.auth.signInWithPassword({ email, password });
  if (loginError || data.user?.id !== user.id) throw loginError || new Error("Login user ID mismatch.");
  const { error: profileError, data: profile } = await client.from("profiles").select("id, platform_role").eq("id", user.id).single();
  if (profileError) throw profileError;
  fs.writeFileSync(credentialsPath, `Local app: http://localhost:3000/auth/login\nEmail: ${email}\nPassword: ${password}\nProduction password has NOT been changed.\n`, "utf8");
  await client.auth.signOut();
  console.log(`Verified local email/password login and profile RLS (${profile.platform_role}). Credentials saved privately in .local-supabase/login.txt.`);
}

const [action, ...argumentsList] = process.argv.slice(2);
switch (action) {
  case "stage": stage(argumentsList); break;
  case "bootstrap": bootstrap(); break;
  case "restore": restore(); break;
  case "configure": configure(); break;
  case "login": await verifyLogin(argumentsList[0]); break;
  default: throw new Error("Usage: node scripts/local/supabase.mjs stage <MCP files> | bootstrap | restore | configure | login <email>");
}