/*
|--------------------------------------------------------------------------
| Domain WRITE sweep
|--------------------------------------------------------------------------
| Same walk as smoke-domains.mjs but over every mutating route
| (POST/PATCH/PUT/DELETE). Each call sends an EMPTY JSON body and a
| garbage id for every path param, so a correct port either rejects
| (4xx contract message), misses the resource (404) or — for plain
| collection creates — succeeds with a `{success:true}` envelope. What
| it must never do is 500 (unguarded `.map` on undefined, bad INSERT
| columns, type errors).
|
| auth.routes.js is skipped: POST /auth/logout would revoke the sweep
| token mid-run (its writes are covered by scripts/smoke.mjs).
|
| The run creates junk rows on purpose — reseed afterwards:
|   node scripts/reset-db.mjs && npm run migrate && npm run seed
|   && node scripts/db-check.mjs
|
| Run:  node scripts/smoke-writes.mjs
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

/* ---------- collect every mutating path ---------- */
const PREFIX = {
  "users.routes.js": "/users",
  "products.routes.js": "/products",
};
const writes = [];
for (const file of fs.readdirSync(routesDir).sort()) {
  if (!file.endsWith(".routes.js")) continue;
  if (file === "auth.routes.js") continue; /* logout revokes the token */
  const src = fs.readFileSync(path.join(routesDir, file), "utf8");
  const re = /router\.(post|patch|put|delete)\(\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    writes.push({
      file,
      method: m[1].toUpperCase(),
      prefix: PREFIX[file] || "",
      path: m[2],
    });
  }
}

/* ---------- vendor admin token (same as GET sweep) ---------- */
const seed = JSON.parse(
  fs.readFileSync(
    "C:/Users/Admin/OneDrive/Documents/Default Project/nexiv-backend/data/frontend-seed.json",
    "utf8"
  )
);
const creds = seed.credentials || {};
const users = await pool.query(
  `SELECT id, email, role, vendor_id, password_hash FROM users
   WHERE vendor_id = 'v-01' AND status = 'ACTIVE'
   ORDER BY (role LIKE '%ADMIN%') DESC, role`
);
const user = users.rows.find((u) => creds[u.email]) || users.rows[0];
if (!user || !creds[user.email] || !(await comparePassword(creds[user.email], user.password_hash))) {
  console.error("no usable vendor user found");
  process.exit(1);
}
const token = generateAccessToken(user.id, {
  role: user.role,
  vendorId: user.vendor_id,
});

/* ---------- boot ---------- */
const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const call = (method, p) =>
  fetch(base + p, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    redirect: "manual",
  }).then(async (res) => {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON */
    }
    return { status: res.status, body };
  });

/* ---------- run ---------- */
const results = [];
for (const w of writes) {
  const p =
    "/api/v1" +
    w.prefix +
    w.path
      .replace(/:vendorId/g, user.vendor_id)
      .replace(/:[A-Za-z]+/g, "zz-no-such-id");
  let r;
  try {
    r = await call(w.method, p);
  } catch (err) {
    results.push({ ...w, p, status: 0, message: String(err) });
    continue;
  }
  const envelopeOk = !(r.status >= 200 && r.status < 300) || (r.body && r.body.success === true);
  results.push({
    ...w,
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

const failures = results.filter((r) => r.status >= 500 || r.status === 0 || !r.envelopeOk);
const bucket = (pred) => results.filter(pred).length;

console.log(`\nmutating routes found: ${results.length}`);
console.log(
  `  2xx: ${bucket((r) => r.status >= 200 && r.status < 300)}` +
    `  4xx: ${bucket((r) => r.status >= 400 && r.status < 500)}` +
    `  5xx: ${bucket((r) => r.status >= 500)}` +
    `  net: ${bucket((r) => r.status === 0)}`
);
console.log(`  as ${user.email} (${user.role} @ ${user.vendor_id})\n`);

for (const r of results) {
  const bad = r.status >= 500 || r.status === 0 || !r.envelopeOk;
  console.log(
    `${bad ? "FAIL" : "ok  "} ${r.method.padEnd(6)} ${String(r.status).padEnd(3)} ${r.p}` +
      (r.message ? `  <- ${r.message.slice(0, 110)}` : "")
  );
}

console.log(`\n${results.length - failures.length}/${results.length} passed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) {
    console.log(`  ${f.method} ${f.status} ${f.p}  ${f.message}`);
  }
}

server.close();
await pool.end();
process.exit(failures.length ? 1 : 0);
