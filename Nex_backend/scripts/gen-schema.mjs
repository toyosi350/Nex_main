/**
 * Generates one migration file per contract table from the reference seed
 * data (Default Project/nexiv-backend/data/frontend-seed.json), plus the
 * marketplace catalog archived at Nex_main/removed-mock-data.
 *
 * Conventions applied (matching the hand-written migrations in this repo):
 *   - one CREATE TABLE IF NOT EXISTS per numbered file
 *   - camelCase contract fields -> snake_case columns
 *   - ids are TEXT (contract uses string ids like "ord-123"), except the
 *     marketplace catalog which uses numeric ids
 *   - dates stay TEXT so ISO strings round-trip byte-identically
 *   - money -> NUMERIC(15,2) (see db.js numeric parser), other decimals ->
 *     DOUBLE PRECISION, arrays/objects -> JSONB, booleans -> BOOLEAN
 *   - NO foreign keys on contract tables: the UI relies on permissive
 *     deletes (e.g. deleting a customer that still has invoices)
 *
 * Usage:  node scripts/gen-schema.mjs [--report]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SEED = "C:/Users/Admin/OneDrive/Documents/Default Project/nexiv-backend/data/frontend-seed.json";
const MARKETPLACE =
  "C:/Users/Admin/OneDrive/Documents/Nex_main/removed-mock-data/Nex-IV/src/data/Products.js";

const MIGRATIONS = path.join(ROOT, "src", "database", "migrations");

/* collection -> { table, file } — collections not listed map 1:1 */
const MAP = {
  suppliers: "011_create_suppliers",
  categories: "012_create_categories",
  products: "013_create_products",
  warehouses: "014_create_warehouses",
  stock: "015_create_stock",
  quotes: "016_create_quotes",
  orders: "017_create_orders",
  invoices: "018_create_invoices",
  payments: "019_create_payments",
  purchaseRequests: "020_create_purchase_requests",
  purchaseOrders: "021_create_purchase_orders",
  receipts: "022_create_receipts",
  expenses: "023_create_expenses",
  departments: "024_create_departments",
  attendance: "025_create_attendance",
  leave: "026_create_leave_requests",
  projects: "027_create_projects",
  tasks: "028_create_tasks",
  leads: "029_create_leads",
  tickets: "030_create_tickets",
  notifications: "031_create_notifications",
  auditLogs: "032_create_audit_logs",
  searches: "033_create_searches",
  adjustments: "034_create_adjustments",
  transfers: "035_create_transfers",
  reviews: "036_create_reviews",
  shoppers: "037_create_shoppers",
  shopOrders: "038_create_shop_orders",
  shopViews: "039_create_shop_views",
};

/* hand-written migrations (edited in place) — only reported on */
const HAND_WRITTEN = ["vendors", "users", "customers", "employees"];

/* collections that are empty in the seed — shapes taken from the mock's
 * POST handlers (removed-mock-data/src/services/mock/server.js) */
const EMPTY_SHAPES = {
  adjustments: [
    { id: "adj-0" }, { number: "" }, { vendorId: "" }, { productId: "" },
    { warehouseId: "" }, { type: "" }, { quantity: 0 }, { reason: "" },
    { createdBy: "" }, { createdAt: "" },
  ],
  transfers: [
    { id: "tr-0" }, { reference: "" }, { vendorId: "" }, { productId: "" },
    { fromWarehouseId: "" }, { toWarehouseId: "" }, { quantity: 0 },
    { status: "" }, { requestedBy: "" }, { createdAt: "" }, { updatedAt: "" },
    { history: [] },
  ],
};

/* extra columns with no seed key (position = file order of the archived
 * catalog, so GET /products can reproduce it deterministically) */
const EXTRA_COLUMNS = {
  marketplace_products: ["position INTEGER"],
};

/* per-collection column renames: the seed's plaintext shopper `password`
 * becomes a bcrypt `password_hash`, the way the reference backend's seed
 * transformed it (shop login compares passwordHash) */
const COLUMN_RENAME = {
  shoppers: { password: "password_hash" },
};

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

const MONEY = /(^|_)(price|cost|amount|fee|salary|total|subtotal|tax|discount|balance|credit|budget|limit|value|revenue|paid|due|outstanding|monthly_fee|compensation)/;
const JSON_HINT = /(Ids|Tags|List|permissions|activity|specs|variants|subscription|store|base_stock|dimensions)/;

const snake = (s) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase();

function inferType(key, values) {
  const nonNull = values.filter((v) => v !== null && v !== undefined);
  if (nonNull.length === 0) return JSON_HINT.test(key) ? "JSONB" : "TEXT";

  const kinds = new Set(nonNull.map((v) => (Array.isArray(v) ? "array" : typeof v)));
  if (kinds.has("array") || kinds.has("object")) return "JSONB";
  if (kinds.size === 1 && kinds.has("boolean")) return "BOOLEAN";
  if ([...kinds].every((k) => k === "number")) {
    if (MONEY.test(snake(key))) return "NUMERIC(15, 2)";
    return nonNull.every(Number.isInteger) ? "INTEGER" : "DOUBLE PRECISION";
  }
  if (kinds.size === 1 && kinds.has("string")) return "TEXT";
  return "JSONB"; // mixed shapes — keep whatever arrives
}

function collect(rows) {
  const keys = [];
  const seen = new Set();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  const types = {};
  for (const k of keys) {
    types[k] = inferType(k, rows.map((r) => r[k]));
  }
  return { keys, types };
}

function idType(rows) {
  const ids = rows.map((r) => r.id).filter((v) => v !== null && v !== undefined);
  if (ids.length && ids.every((v) => typeof v === "number")) return "INTEGER";
  return "TEXT";
}

function renderTable(table, rows) {
  const { keys, types } = collect(rows);
  if (!keys.includes("id")) throw new Error(`${table}: rows have no id column`);

  const idCol = idType(rows) === "INTEGER" ? "id INTEGER PRIMARY KEY" : "id TEXT PRIMARY KEY";
  const cols = [`    ${idCol}`];

  const renames = COLUMN_RENAME[table] || {};
  for (const k of keys) {
    if (k === "id") continue;
    let col = renames[k] || snake(k);
    if (RESERVED.has(col)) col = `"${col}"`;
    cols.push(`    ${col} ${types[k]}`);
  }

  for (const col of EXTRA_COLUMNS[table] || []) cols.push(`    ${col}`);

  /* route-built rows may carry fields the seed never had — they are
     parked here, exactly like the reference backend's `extra` column */
  if (!keys.includes("extra")) cols.push("    extra JSONB");

  let sql = `CREATE TABLE IF NOT EXISTS ${table} (\n${cols.join(",\n\n")}\n);`;

  /* index every fk-style column so vendor-scoped lists use the index */
  const idx = keys
    .map(snake)
    .filter((c) => /(_id|^id$)/.test(c) && c !== "id")
    .map((c) => `CREATE INDEX IF NOT EXISTS idx_${table}_${c} ON ${table} (${c});`);
  if (idx.length) sql += `\n\n${idx.join("\n\n")}`;

  return sql + "\n";
}

/* ------------------------------------------------------------------ */

const reportOnly = process.argv.includes("--report");
const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));

/* marketplace catalog (archived Products.js) */
const mod = await import(pathToFileUrl(MARKETPLACE));
const marketplace = mod.default;

if (reportOnly) {
  for (const name of [...Object.keys(MAP), ...HAND_WRITTEN]) {
    const rows = seed[name];
    if (!rows) {
      console.log(`\n### ${name}: MISSING from seed`);
      continue;
    }
    const { keys, types } = collect(rows);
    console.log(`\n### ${name}  (${rows.length} rows, ${keys.length} cols)`);
    console.log(keys.map((k) => `${k}: ${types[k]}`).join("\n"));
  }
  console.log(`\n### marketplace_products  (${marketplace.length} rows)`);
  const m = collect(marketplace);
  console.log(m.keys.map((k) => `${k}: ${m.types[k]}`).join("\n"));
  process.exit(0);
}

let written = 0;
for (const [collection, file] of Object.entries(MAP)) {
  const rows = seed[collection]?.length ? seed[collection] : EMPTY_SHAPES[collection];
  if (!rows) throw new Error(`seed collection missing: ${collection}`);
  const table = file.replace(/^\d+_create_/, "");
  const sql = renderTable(table, rows);
  fs.writeFileSync(path.join(MIGRATIONS, `${file}.sql`), sql);
  written++;
}

fs.writeFileSync(
  path.join(MIGRATIONS, "040_create_marketplace_products.sql"),
  renderTable("marketplace_products", marketplace)
);
written++;

console.log(`Wrote ${written} migration files to src/database/migrations`);

function pathToFileUrl(p) {
  const u = path.resolve(p).replace(/\\/g, "/");
  return "file:///" + (u.startsWith("/") ? u.slice(1) : u);
}
