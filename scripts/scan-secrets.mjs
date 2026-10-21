import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const allowed = new Set(["scripts/scan-secrets.mjs"]);
const patterns = [
  { name: "OpenRouter key", value: /sk-or-[A-Za-z0-9_-]{16,}/g },
  { name: "NVIDIA key", value: /nvapi-[A-Za-z0-9_-]{16,}/g },
  { name: "Supabase secret key", value: /sb_secret_[A-Za-z0-9_-]{16,}/g },
];

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const findings = [];
for (const path of trackedFiles) {
  const file = join(root, path);
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
