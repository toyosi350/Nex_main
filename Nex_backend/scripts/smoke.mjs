/**
 * Smoke test: boots the app on an ephemeral port and exercises the
 * auth + marketplace contract end to end (status codes, messages,
 * payload shapes, token round-trips). Run with:
 *
 *     node scripts/smoke.mjs
 *
 * Exits non-zero on the first failed expectation. Cleans up the
 * throwaway user it registers.
 */
import app from "../src/app.js";
import pool from "../src/config/db.js";

const results = [];
let failures = 0;

function check(name, condition, detail = "") {
  results.push(`${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : `  -> ${detail}`}`);
  if (!condition) failures += 1;
}

const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function call(method, path, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, body: data };
}

/* ---------- welcome + 404 ---------- */
{
  const r = await call("GET", "/");
  check("GET / welcome", r.status === 200 && r.body?.message === "Welcome to NexERP API", JSON.stringify(r.body));

  const r404 = await call("GET", "/nope/missing");
  check(
    "unknown route -> JSON 404",
    r404.status === 404 && r404.body?.success === false && typeof r404.body?.message === "string",
    JSON.stringify(r404.body)
  );
}

/* ---------- login ---------- */
let access;
let refresh;
{
  const r = await call("POST", "/api/v1/auth/login", {
    body: { email: "super@nexiv.app", password: "NeXiv-2026-Super#K", remember: true },
  });
  const d = r.body?.data;
  check("login 200", r.status === 200 && r.body?.success === true, JSON.stringify(r.body));
  check(
    "login payload = {message,user,vendor,accessToken,refreshToken}",
    !!d?.message && !!d?.user && !!d && "vendor" in d && !!d?.accessToken && !!d?.refreshToken,
    JSON.stringify(d && Object.keys(d))
  );
  check(
    "login user contract shape",
    !!d?.user?.id && d?.user?.email === "super@nexiv.app" && d?.user?.role === "SUPER_ADMIN" &&
      "vendorId" in d.user && "name" in d.user && "phone" in d.user && "lastLogin" in d.user &&
      "permissions" in d.user && d.user.username === d.user.name && !("passwordHash" in d.user),
    JSON.stringify(d?.user)
  );
  /* mock: vendor = user.vendorId ? find : null — super has no tenant */
  check("login vendor: platform admin carries vendor=null", !!d && d.vendor === null, JSON.stringify(d?.vendor));
  access = d?.accessToken;
  refresh = d?.refreshToken;
}

/* ---------- wrong password / inactive-free errors ---------- */
{
  const r = await call("POST", "/api/v1/auth/login", {
    body: { email: "super@nexiv.app", password: "wrong-password" },
  });
  check(
    "bad password -> 401 'Invalid email or password'",
    r.status === 401 && r.body?.message === "Invalid email or password",
    JSON.stringify(r.body)
  );

  const missing = await call("POST", "/api/v1/auth/login", { body: { email: "", password: "" } });
  check(
    "missing fields -> 400 'Email and password are required'",
    missing.status === 400 && missing.body?.message === "Email and password are required",
    JSON.stringify(missing.body)
  );

  const noBody = await call("POST", "/api/v1/auth/login", { body: {} });
  check(
    "empty body -> same 400",
    noBody.status === 400 && noBody.body?.message === "Email and password are required",
    JSON.stringify(noBody.body)
  );

  const badFormat = await call("POST", "/api/v1/auth/login", {
    body: { email: "not-an-email", password: "whatever" },
  });
  check(
    "malformed email -> 401 (mock never format-checks)",
    badFormat.status === 401 && badFormat.body?.message === "Invalid email or password",
    JSON.stringify(badFormat.body)
  );

  const upperCase = await call("POST", "/api/v1/auth/login", {
    body: { email: "SUPER@NEXIV.APP", password: "NeXiv-2026-Super#K" },
  });
  check("login email case-insensitive", upperCase.status === 200, JSON.stringify(upperCase.body));
}

/* ---------- me ---------- */
{
  const r = await call("GET", "/api/v1/auth/me", { token: access });
  check(
    "me 200 -> {user, vendor}",
    r.status === 200 && !!r.body?.data?.user && "vendor" in (r.body?.data || {}) && r.body?.data?.vendor === null,
    JSON.stringify(r.body)
  );

  const anon = await call("GET", "/api/v1/auth/me");
  check("me anonymous -> 401", anon.status === 401 && anon.body?.success === false, JSON.stringify(anon.body));
}

/* ---------- refresh ---------- */
{
  const r = await call("POST", "/api/v1/auth/refresh", { body: { refreshToken: refresh } });
  check(
    "refresh 200 -> {accessToken,user,vendor}",
    r.status === 200 && !!r.body?.data?.accessToken && !!r.body?.data?.user && "vendor" in (r.body?.data || {}),
    JSON.stringify(r.body)
  );

  const noToken = await call("POST", "/api/v1/auth/refresh", { body: {} });
  check(
    "refresh without token -> 401 'Invalid refresh token'",
    noToken.status === 401 && noToken.body?.message === "Invalid refresh token",
    JSON.stringify(noToken.body)
  );

  const garbage = await call("POST", "/api/v1/auth/refresh", { body: { refreshToken: "garbage" } });
  check(
    "refresh with garbage -> same 401",
    garbage.status === 401 && garbage.body?.message === "Invalid refresh token",
    JSON.stringify(garbage.body)
  );
}

/* ---------- marketplace catalog ---------- */
{
  const r = await call("GET", "/api/v1/products");
  const list = r.body?.data;
  check("GET /products 200", r.status === 200 && r.body?.success === true, JSON.stringify(r.body).slice(0, 200));
  check("32 products", Array.isArray(list) && list.length === 32, `len=${list?.length}`);
  check("file order preserved (first id = 3)", list?.[0]?.id === 3, `first=${list?.[0]?.id}`);
  check(
    "row shape has no internal position key",
    !!list?.[0]?.name && !("position" in list[0]) && "price" in list[0],
    JSON.stringify(Object.keys(list?.[0] || {}))
  );
}

/* ---------- register (ERP shape) ---------- */
const throwawayEmail = `smoke-${Date.now()}@example.test`;
let throwawayToken;
{
  const r = await call("POST", "/api/v1/auth/register", {
    body: {
      name: "Smoke Tester",
      email: throwawayEmail,
      password: "Smoke-Test-2026#K",
      company: { name: "Prime Office Supplies", industry: "Retail", plan: "GROWTH" },
    },
  });
  const d = r.body?.data;
  check(
    "register 201 -> {user,message,accessToken,refreshToken}",
    r.status === 201 && !!d?.user && d?.message === "Account created successfully" && !!d?.accessToken && !!d?.refreshToken,
    JSON.stringify(r.body).slice(0, 300)
  );
  check(
    "register joins matching vendor as VENDOR_ADMIN",
    d?.user?.role === "VENDOR_ADMIN" && !!d?.user?.vendorId,
    JSON.stringify(d?.user)
  );
  throwawayToken = d?.accessToken;

  const dup = await call("POST", "/api/v1/auth/register", {
    body: { name: "Dup", email: throwawayEmail, password: "Smoke-Test-2026#K" },
  });
  check(
    "duplicate email -> 409 mock message",
    dup.status === 409 && dup.body?.message === "An account with this email already exists",
    JSON.stringify(dup.body)
  );

  const noName = await call("POST", "/api/v1/auth/register", {
    body: { email: "nobody-name@example.test", password: "long-enough" },
  });
  check(
    "register without name -> 400 'Name, email and password are required'",
    noName.status === 400 && noName.body?.message === "Name, email and password are required",
    JSON.stringify(noName.body)
  );

  const shortEmail = `short-${Date.now()}@example.test`;
  const shortPw = await call("POST", "/api/v1/auth/register", {
    body: { name: "Short Pw", email: shortEmail, password: "short" },
  });
  check(
    "register accepts short password (mock has no min-8)",
    shortPw.status === 201 && !!shortPw.body?.data?.user?.id,
    JSON.stringify(shortPw.body).slice(0, 200)
  );
  await pool.query("DELETE FROM users WHERE email = $1", [shortEmail]);
}

/* ---------- forgot -> reset -> login with new password ---------- */
{
  const unknown = await call("POST", "/api/v1/auth/forgot-password", {
    body: { email: "nobody@example.test" },
  });
  check(
    "forgot unknown email -> 404 mock message",
    unknown.status === 404 && unknown.body?.message === "No account found with that email address",
    JSON.stringify(unknown.body)
  );

  const badForgot = await call("POST", "/api/v1/auth/forgot-password", {
    body: { email: "not-an-email" },
  });
  check(
    "forgot malformed email -> 404 (mock never format-checks)",
    badForgot.status === 404 && badForgot.body?.message === "No account found with that email address",
    JSON.stringify(badForgot.body)
  );

  const forgot = await call("POST", "/api/v1/auth/forgot-password", {
    body: { email: throwawayEmail },
  });
  const token = forgot.body?.resetToken;
  check(
    "forgot known email -> 200 + resetToken",
    forgot.status === 200 && forgot.body?.message === "If the email exists, a reset link has been sent." && !!token,
    JSON.stringify(forgot.body).slice(0, 200)
  );

  const resetNoFields = await call("POST", "/api/v1/auth/reset-password", {
    body: { email: throwawayEmail },
  });
  check(
    "reset missing fields -> 400 'All fields are required'",
    resetNoFields.status === 400 && resetNoFields.body?.message === "All fields are required",
    JSON.stringify(resetNoFields.body)
  );

  const reset = await call("POST", "/api/v1/auth/reset-password", {
    body: { email: throwawayEmail, token, password: "Reset-Test-2026#K" },
  });
  check(
    "reset 200 mock message",
    reset.status === 200 && reset.body?.message === "Password reset successfully. You can now sign in.",
    JSON.stringify(reset.body)
  );

  const old = await call("POST", "/api/v1/auth/login", {
    body: { email: throwawayEmail, password: "Smoke-Test-2026#K" },
  });
  check("old password no longer works", old.status === 401, JSON.stringify(old.body));

  const fresh = await call("POST", "/api/v1/auth/login", {
    body: { email: throwawayEmail, password: "Reset-Test-2026#K" },
  });
  check("new password logs in", fresh.status === 200 && !!fresh.body?.data?.accessToken, JSON.stringify(fresh.body));
}

/* ---------- change-password (PATCH) ---------- */
{
  const login = await call("POST", "/api/v1/auth/login", {
    body: { email: throwawayEmail, password: "Reset-Test-2026#K" },
  });
  const token = login.body?.data?.accessToken;

  const noPw = await call("PATCH", "/api/v1/auth/change-password", { token, body: {} });
  check(
    "change-password empty body -> 400 'Both passwords are required'",
    noPw.status === 400 && noPw.body?.message === "Both passwords are required",
    JSON.stringify(noPw.body)
  );

  const wrong = await call("PATCH", "/api/v1/auth/change-password", {
    token,
    body: { currentPassword: "not-the-password", newPassword: "Changed-2026#K" },
  });
  check(
    "change-password wrong current -> 401 mock message",
    wrong.status === 401 && wrong.body?.message === "Current password is incorrect",
    JSON.stringify(wrong.body)
  );

  const same = await call("PATCH", "/api/v1/auth/change-password", {
    token,
    body: { currentPassword: "Reset-Test-2026#K", newPassword: "Reset-Test-2026#K" },
  });
  check(
    "change-password same password -> 400 mock message",
    same.status === 400 && same.body?.message === "New password must differ from current password",
    JSON.stringify(same.body)
  );

  const ok = await call("PATCH", "/api/v1/auth/change-password", {
    token,
    body: { currentPassword: "Reset-Test-2026#K", newPassword: "Changed-2026#K" },
  });
  check("change-password 200", ok.status === 200 && ok.body?.message === "Password changed successfully", JSON.stringify(ok.body));

  const login2 = await call("POST", "/api/v1/auth/login", {
    body: { email: throwawayEmail, password: "Changed-2026#K" },
  });
  check("changed password logs in", login2.status === 200 && !!login2.body?.data?.accessToken, JSON.stringify(login2.body));
}

/* ---------- logout (no body) ---------- */
{
  const r = await call("POST", "/api/v1/auth/logout", {});
  check("logout without body -> 200 'Logged out'", r.status === 200 && r.body?.message === "Logged out", JSON.stringify(r.body));
}

/* ---------- cleanup + report ---------- */
await pool.query("DELETE FROM users WHERE email = $1", [throwawayEmail]);
await pool.end();
server.close();

console.log(results.join("\n"));
console.log(`\n${results.length - failures}/${results.length} passed`);
process.exit(failures ? 1 : 0);
