/**
 * Post-migrate sanity check: row counts per table plus proof that the
 * seeded demo passwords actually verify through bcrypt the same way
 * the API's login handlers do.
 */
import bcrypt from "bcrypt";
import pool from "../src/config/db.js";

const tables = [
  "permissions", "roles", "role_permissions",
  "vendors", "users", "customers", "employees", "suppliers",
  "categories", "products", "stock", "quotes", "orders", "invoices",
  "payments", "purchase_requests", "purchase_orders", "receipts",
  "expenses", "departments", "attendance", "leave_requests", "projects",
  "tasks", "leads", "tickets", "notifications", "audit_logs",
  "reviews", "shoppers", "shop_orders", "marketplace_products",
];

const counts = {};
for (const t of tables) {
  counts[t] = (await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`)).rows[0].n;
}
console.log(counts);

const user = await pool.query(
  "SELECT password_hash FROM users WHERE email = $1",
  ["super@nexiv.app"]
);
const shopper = await pool.query(
  "SELECT password_hash FROM shoppers WHERE email = $1",
  ["chidinma.okeke@gmail.com"]
);

const userOk = await bcrypt.compare(
  "NeXiv-2026-Super#K",
  user.rows[0]?.password_hash || ""
);
const shopperOk = await bcrypt.compare(
  "ShopDemo-2026#K",
  shopper.rows[0]?.password_hash || ""
);

console.log(`demo user login verifies: ${userOk}`);
console.log(`demo shopper login verifies: ${shopperOk}`);

if (!userOk || !shopperOk) process.exitCode = 1;

await pool.end();
