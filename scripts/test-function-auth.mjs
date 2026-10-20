const baseUrl = process.env.FUNCTION_BASE_URL?.replace(/\/$/, "");
const cronSecret = process.env.CRON_SECRET;
const adminToken = process.env.E2E_ADMIN_JWT;
const nonAdminToken = process.env.E2E_NON_ADMIN_JWT;
const functions = [
  "fetch-startup-updates",
  "fetch-themed-posts",
  "sync-launches",
  "sync-topic-content",
  "send-weekly-digest",
];

if (!baseUrl || !cronSecret || !adminToken || !nonAdminToken) {
  throw new Error("FUNCTION_BASE_URL, CRON_SECRET, E2E_ADMIN_JWT, and E2E_NON_ADMIN_JWT are required against a dedicated test project.");
}

async function request(name, headers) {
  const response = await fetch(`${baseUrl}/${name}`, { method: "POST", headers });
  return response.status;
}

for (const name of functions) {
  if (await request(name, {}) !== 401) throw new Error(`${name}: anonymous request was not rejected`);
  for (const [label, headers] of [
    ["cron", { "x-cron-secret": cronSecret }],
    ["admin", { authorization: `Bearer ${adminToken}` }],
  ]) {
    const status = await request(name, headers);
    if (status === 401 || status === 403) throw new Error(`${name}: ${label} caller was rejected with ${status}`);
  }
  if (await request(name, { authorization: `Bearer ${nonAdminToken}` }) !== 403) {
    throw new Error(`${name}: non-admin caller was not rejected`);
  }
}

console.log("Internal function authentication checks passed.");
