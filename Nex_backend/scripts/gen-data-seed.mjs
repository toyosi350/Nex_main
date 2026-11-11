/**
 * Generates `seeds/004_seed_demo_data.sql` from the reference seed data:
 *
 *   - every contract table, loaded from
 *     Default Project/nexiv-backend/data/frontend-seed.json
 *   - the demo passwords in that file's `credentials` map, bcrypt-hashed
 *     with the same helper the API uses, into users.password_hash
 *   - the archived marketplace catalog (Nex_main/removed-mock-data)
 *     into marketplace_products
 *
 * The file opens with DELETEs so re-running this one seed is safe;
 * seeds 001-003 (RBAC) are left alone. One INSERT per table, values
 * encoded by column type — JSONB as ::jsonb, booleans as TRUE/FALSE,
 * everything else as literals.
 *
 * Usage:  node scripts/gen-data-seed.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { hashPassword } from "../src/utils/password.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SEED = "C:/Users/Admin/OneDrive/Documents/Default Project/nexiv-backend/data/frontend-seed.json";
const MARKETPLACE =
  "C:/Users/Admin/OneDrive/Documents/Nex_main/removed-mock-data/Nex-IV/src/data/Products.js";
const OUT = path.join(ROOT, "src", "database", "seeds", "004_seed_demo_data.sql");

const snake = (s) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase();

/* collection -> table (collections not listed map 1:1) */
const MAP = {
  vendors: "vendors",
  users: "users",
  customers: "customers",
  employees: "employees",
  suppliers: "suppliers",
  categories: "categories",
  products: "products",
  warehouses: "warehouses",
  stock: "stock",
  quotes: "quotes",
  orders: "orders",
  invoices: "invoices",
  payments: "payments",
  purchaseRequests: "purchase_requests",
  purchaseOrders: "purchase_orders",
  receipts: "receipts",
  expenses: "expenses",
  departments: "departments",
  attendance: "attendance",
  leave: "leave_requests",
  projects: "projects",
  tasks: "tasks",
  leads: "leads",
  tickets: "tickets",
  notifications: "notifications",
  auditLogs: "audit_logs",
  searches: "searches",
  adjustments: "adjustments",
  transfers: "transfers",
  reviews: "reviews",
  shoppers: "shoppers",
  shopOrders: "shop_orders",
  shopViews: "shop_views",
};

const enc = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const CHUNK = 500;

/* words Postgres will not accept unquoted as a column identifier —
 * matches the RESERVED set in gen-schema.mjs (e.g. tasks.order) */
const RESERVED = new Set([
  "all", "analyse", "analyze", "and", "any", "array", "as", "asc", "asymmetric",
  "authorization", "binary", "both", "case", "cast", "check", "collate", "column",
  "concurrently", "constraint", "create", "cross", "current_date", "current_time",
  "current_timestamp", "current_user", "default", "deferrable", "desc", "distinct",
  "do", "else", "end", "except", "false", "fetch", "for", "foreign", "freeze",
  "from", "full", "grant", "group", "having", "ilike", "in", "initially", "inner",
  "intersect", "into", "is", "isnull", "join", "lateral", "leading", "left",
  "like", "limit", "localtime", "localtimestamp", "natural", "not", "notnull",
  "null", "offset", "on", "only", "or", "order", "outer", "over", "overlaps",
  "placing", "primary", "references", "returning", "right", "select", "session_user",
  "similar", "some", "symmetric", "tablesample", "then", "to", "trailing", "true",
  "union", "unique", "user", "using", "variadic", "verbose", "when", "where",
  "window", "with",
]);
const quoteCol = (c) => (RESERVED.has(c) ? `"${c}"` : c);

function renderInserts(table, rows, extraColumns = {}) {
  if (!rows.length) return [];

  /* fixed column list = union of every row's keys (snake) */
  const keys = [];
  const seen = new Set();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      const col = snake(k);
      if (!seen.has(col)) {
        seen.add(col);
        keys.push(col);
      }
    }
  }
  for (const col of Object.keys(extraColumns)) {
    if (!seen.has(col)) {
      seen.add(col);
      keys.push(col);
    }
  }

  const stmts = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const tuples = slice.map((row) => {
      const values = keys.map((col) => {
        if (col in extraColumns) {
          const v = extraColumns[col](row);
          return enc(v);
        }
        /* column came from a camelCase key of this row */
        const key = Object.keys(row).find((k) => snake(k) === col);
        return key === undefined ? "NULL" : enc(row[key]);
      });
      return `    (${values.join(", ")})`;
    });
    stmts.push(
      `INSERT INTO ${table} (${keys.map(quoteCol).join(", ")}) VALUES\n${tuples.join(",\n")};`
    );
  }
  return stmts;
}

/* ------------------------------------------------------------------ */

const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
const mod = await import(
  "file:///" + MARKETPLACE.replace(/\\/g, "/").replace(/^\/+/, "")
);
const marketplace = mod.default;

/*
| Demo passwords: every user in the file has an entry in credentials
| (plaintext, same values the login page's quick-fill uses). Hash with
| the API's own helper so bcrypt.compare accepts them.
*/
const credentials = seed.credentials || {};
const hashedPasswords = new Map();
for (const [email, password] of Object.entries(credentials)) {
  hashedPasswords.set(email.toLowerCase(), await hashPassword(password));
}

/* shoppers carry plaintext passwords in the seed; the column and shop
   login both expect bcrypt hashes (same transform the reference seed did) */
const shopperHashes = new Map();
for (const shopper of seed.shoppers || []) {
  shopperHashes.set(
    String(shopper.email).toLowerCase(),
    await hashPassword(shopper.password)
  );
}

const parts = [];

parts.push(`/*
| Demo data — generated by scripts/gen-data-seed.mjs from the reference
| seed (nexiv-backend/data/frontend-seed.json) plus the archived
| marketplace catalog. Re-running just this file is safe (it opens with
| DELETEs); run \`npm run migrate && npm run seed\` for a full rebuild.
*/

DELETE FROM suppliers;
DELETE FROM categories;
DELETE FROM products;
DELETE FROM warehouses;
DELETE FROM stock;
DELETE FROM quotes;
DELETE FROM orders;
DELETE FROM invoices;
DELETE FROM payments;
DELETE FROM purchase_requests;
DELETE FROM purchase_orders;
DELETE FROM receipts;
DELETE FROM expenses;
DELETE FROM departments;
DELETE FROM attendance;
DELETE FROM leave_requests;
DELETE FROM projects;
DELETE FROM tasks;
DELETE FROM leads;
DELETE FROM tickets;
DELETE FROM notifications;
DELETE FROM audit_logs;
DELETE FROM searches;
DELETE FROM adjustments;
DELETE FROM transfers;
DELETE FROM reviews;
DELETE FROM shoppers;
DELETE FROM shop_orders;
DELETE FROM shop_views;
DELETE FROM marketplace_products;
DELETE FROM customers;
DELETE FROM employees;
DELETE FROM users;
DELETE FROM vendors;
`);

/* vendors first, then users (login depends on both), then the rest */
const order = ["vendors", "users", "customers", "employees"];
const rest = Object.keys(MAP).filter((c) => !order.includes(c));

for (const collection of [...order, ...rest]) {
  const table = MAP[collection];
  let rows = seed[collection] || [];
  if (!rows.length) continue;

  let extraColumns = {};
  if (table === "users") {
    extraColumns = {
      password_hash: (row) =>
        hashedPasswords.get(String(row.email).toLowerCase()) ?? null,
    };
  }
  if (table === "shoppers") {
    extraColumns = {
      password_hash: (row) =>
        shopperHashes.get(String(row.email).toLowerCase()) ?? null,
    };
    rows = rows.map((row) => {
      const { password, ...rest } = row;
      return rest;
    });
  }

  parts.push(`/* --- ${table}: ${rows.length} rows --- */`);
  parts.push(...renderInserts(table, rows, extraColumns));
}

/* position = file order of the archived catalog — the storefront must
   render the 32 products exactly as the mock's in-memory array did */
const marketplaceRows = marketplace.map((p, i) => ({ ...p, position: i }));
parts.push(`/* --- marketplace_products: ${marketplaceRows.length} rows --- */`);
parts.push(...renderInserts("marketplace_products", marketplaceRows));

fs.writeFileSync(OUT, parts.join("\n\n") + "\n");

const size = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(`Wrote ${OUT} (${size} MB)`);
