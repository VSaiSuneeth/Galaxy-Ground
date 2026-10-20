import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", "dist", ".git", "playwright-report", "test-results"]);
const allowed = new Set(["scripts/scan-secrets.mjs"]);
const patterns = [
  { name: "OpenRouter key", value: /sk-or-[A-Za-z0-9_-]{16,}/g },
  { name: "NVIDIA key", value: /nvapi-[A-Za-z0-9_-]{16,}/g },
  { name: "Supabase secret key", value: /sb_secret_[A-Za-z0-9_-]{16,}/g },
];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const findings = [];
for (const file of files(root)) {
  const path = relative(root, file).replaceAll("\\\\", "/");
  if (allowed.has(path) || statSync(file).size > 1_000_000) continue;
  const contents = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.value.test(contents)) findings.push(`${path}: ${pattern.name}`);
    pattern.value.lastIndex = 0;
  }
}

if (findings.length) {
  console.error("Potential committed secrets found:\\n" + findings.join("\\n"));
  process.exit(1);
}

console.log("Secret scan passed.");
