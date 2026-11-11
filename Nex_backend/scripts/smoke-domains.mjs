/*
|--------------------------------------------------------------------------
| Domain GET sweep
|--------------------------------------------------------------------------
| Boots the app on an ephemeral port, walks every `router.get(...)` in
| src/routes/api/v1/*.routes.js and calls it as an authenticated vendor
| user. Contract paths are mounted at /api/v1, path params are filled
| (:vendorId -> the user's tenant, everything else -> a garbage id that
| must resolve to a 4xx, never a 500).
|
|   PASS  status < 500, and every 200 is a `{success:true}` envelope
|   FAIL  any 5xx, or a 200 that isn't an envelope
|
| 401/403/400/404/409 are legitimate outcomes (missing perm, garbage id,
| public shop routes rejecting a user token...) and are counted, not
| failed. Prints a per-route table plus the failure list.
|
| Run:  node scripts/smoke-domains.mjs
|--------------------------------------------------------------------------
*/
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routesDir = path.join(root, "src", "routes", "api", "v1");

const { default: app } = await import("../src/app.js");
const pool = (await import("../src/config/db.js")).default;
const { comparePassword } = await import("../src/utils/password.js");
const { generateAccessToken } = await import("../src/utils/jwt.js");

/* ---------- collect every GET path from the route files ---------- */
/* routers mounted at a sub-prefix in app.js need it re-added here */
const PREFIX = {
  "auth.routes.js": "/auth",
  "users.routes.js": "/users",
  "products.routes.js": "/products",
};
const gets = [];
for (const file of fs.readdirSync(routesDir).sort()) {
  if (!file.endsWith(".routes.js")) continue;
  const src = fs.readFileSync(path.join(routesDir, file), "utf8");
  const re = /router\.get\(\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    gets.push({ file, prefix: PREFIX[file] || "", path: m[1] });
  }
}

/* ---------- find a vendor user with credentials ---------- */
const seed = JSON.parse(
  fs.readFileSync(
    "C:/Users/Admin/OneDrive/Documents/Default Project/nexiv-backend/data/frontend-seed.json",
    "utf8"
  )
);
const creds = seed.credentials || {};
const users = await pool.query(
  `SELECT id, email, role, vendor_id, password_hash FROM users
   WHERE vendor_id IS NOT NULL AND status = 'ACTIVE' AND vendor_id = 'v-01'
   ORDER BY (role LIKE '%ADMIN%') DESC, role`
);
const user = users.rows.find((u) => creds[u.email]) || users.rows[0];
if (!user || !creds[user.email]) {
  console.error("no vendor user with credentials found");
  process.exit(1);
}
const ok = await comparePassword(creds[user.email], user.password_hash);
if (!ok) {
  console.error("credential mismatch for", user.email);
  process.exit(1);
}
const token = generateAccessToken(user.id, {
  role: user.role,
  vendorId: user.vendor_id,
});

/* ---------- boot on an ephemeral port ---------- */
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const call = (p) =>
  fetch(base + p, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: "manual",
  }).then(async (res) => {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON (shouldn't happen — terminal 404 is JSON) */
    }
    return { status: res.status, body };
  });

/* ---------- run the sweep ---------- */
const results = [];
for (const g of gets) {
  const p =
    "/api/v1" +
    g.prefix +
    g.path
      .replace(/:vendorId/g, user.vendor_id)
      .replace(/:[A-Za-z]+/g, "zz-no-such-id");
  let r;
  try {
    r = await call(p);
  } catch (err) {
    results.push({ ...g, p, status: 0, message: String(err) });
    continue;
  }
  const envelopeOk =
    r.status !== 200 || (r.body && r.body.success === true);
  results.push({
    ...g,
    p,
    status: r.status,
    envelopeOk,
    message:
      r.body && typeof r.body.message === "string"
        ? r.body.message
        : r.body && r.body.success === false
          ? JSON.stringify(r.body)
          : "",
  });
}

const failures = results.filter((r) => r.status >= 500 || !r.envelopeOk);
const bucket = (pred) => results.filter(pred).length;

console.log(`\nGET routes found: ${results.length}`);
console.log(
  `  2xx: ${bucket((r) => r.status >= 200 && r.status < 300)}` +
    `  4xx: ${bucket((r) => r.status >= 400 && r.status < 500)}` +
    `  5xx: ${bucket((r) => r.status >= 500)}` +
    `  net: ${bucket((r) => r.status === 0)}`
);
console.log(`  as ${user.email} (${user.role} @ ${user.vendor_id})\n`);

for (const r of results) {
  const mark = r.status >= 500 || !r.envelopeOk ? "FAIL" : "ok  ";
  console.log(
    `${mark} ${String(r.status).padEnd(3)} ${r.p}` +
      (r.message ? `  <- ${r.message.slice(0, 110)}` : "")
  );
}

console.log(`\n${results.length - failures.length}/${results.length} passed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) {
    console.log(`  ${f.status} ${f.p}  ${f.message}`);
  }
}

server.close();
await pool.end();
process.exit(failures.length ? 1 : 0);
