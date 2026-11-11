/**
 * Regenerates the RBAC seeds from the ERP frontend's own permission model
 * (Nex_main/Nex/src/constants/roles.js) so the backend enforces exactly the
 * permissions the app defines:
 *
 *   seeds/001_seed_permissions.sql   — one row per permission code
 *   seeds/003_seed_role_permissions.sql — role -> permission mapping
 *
 * Their existing file formats are preserved (INSERT ... VALUES lists and
 * name-based INSERT ... SELECT blocks). Roles seed (002) keeps its original
 * four entries first, so it is written by hand.
 *
 * Usage:  node scripts/gen-rbac-seed.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ROLES_JS = "C:/Users/Admin/OneDrive/Documents/Nex_main/Nex/src/constants/roles.js";

const { PERMISSIONS, ALL_PERMISSIONS, ROLE_PERMISSIONS } = await import(
  "file:///" + ROLES_JS.replace(/\\/g, "/")
);

/* module naming follows the original seed: plural uppercase domain */
const NO_PLURAL = new Set([
  "INVENTORY", "ATTENDANCE", "LEAVE", "AUDIT", "DASHBOARD", "ACCOUNTING",
]);
const moduleFor = (code) => {
  const domain = code.split("_")[0];
  if (NO_PLURAL.has(domain)) return domain;
  return domain.endsWith("S") ? domain : domain + "S";
};

const codes = [...new Set(ALL_PERMISSIONS)].sort();

/* ------------------------- 001 permissions ------------------------- */
const byModule = new Map();
for (const code of codes) {
  const mod = moduleFor(code);
  if (!byModule.has(mod)) byModule.set(mod, []);
  byModule.get(mod).push(code);
}

const permLines = [];
let first = true;
for (const [, list] of byModule) {
  if (!first) permLines.push("");
  first = false;
  list.forEach((code, i) => {
    const isLastModule = [...byModule.values()].indexOf(list) === byModule.size - 1;
    const isLast = i === list.length - 1 && isLastModule;
    permLines.push(`    ('${code}', '${moduleFor(code)}')${isLast ? ";" : ","}`);
  });
}

fs.writeFileSync(
  path.join(ROOT, "src", "database", "seeds", "001_seed_permissions.sql"),
  `INSERT INTO permissions (code, module)\nVALUES\n${permLines.join("\n")}\n`
);

/* ------------------- 003 role_permissions blocks -------------------- */
const ORDER = [
  "VENDOR_ADMIN", "SALES_MANAGER", "ACCOUNTANT", "INVENTORY_MANAGER",
  "SUPER_ADMIN", "PLATFORM_SUPPORT", "SALES_AGENT", "WAREHOUSE_MANAGER",
  "HR_MANAGER", "PURCHASING_MANAGER", "SUPPORT_AGENT", "EMPLOYEE",
];

const blocks = [];
for (const role of ORDER) {
  const perms = (ROLE_PERMISSIONS[role] || []).filter(Boolean);
  if (!perms.length) throw new Error(`no permissions for role ${role}`);

  if (perms.length === codes.length) {
    blocks.push(
      `INSERT INTO role_permissions (role_id, permission_id)\n` +
        `SELECT\n` +
        `    r.id,\n` +
        `    p.id\n` +
        `FROM roles r\n` +
        `CROSS JOIN permissions p\n` +
        `WHERE r.name = '${role}';`
    );
    continue;
  }

  const unique = [...new Set(perms)].sort();
  const list = unique.map((c, i) => `        '${c}'${i === unique.length - 1 ? "" : ","}`);
  blocks.push(
    `INSERT INTO role_permissions (role_id, permission_id)\n` +
      `SELECT\n` +
      `    r.id,\n` +
      `    p.id\n` +
      `FROM roles r\n` +
      `JOIN permissions p\n` +
      `    ON p.code IN (\n${list.join("\n")}\n    )\n` +
      `WHERE r.name = '${role}';`
  );
}

fs.writeFileSync(
  path.join(ROOT, "src", "database", "seeds", "003_seed_role_permissions.sql"),
  blocks.join("\n\n\n") + "\n"
);

console.log(
  `Wrote seeds: ${codes.length} permissions across ${byModule.size} modules, ` +
    `${ORDER.length} role mappings`
);
