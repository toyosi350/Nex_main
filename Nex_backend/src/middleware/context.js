import table from "../repositories/table.js";
import { forbidden, notFound, unauthorized } from "../errors/api.errors.js";
import { filterBySearch, nowISO, paginate, sortItems } from "../utils/http.js";

/*
|--------------------------------------------------------------------
| The request-scoped helpers every contract route uses.
|
| These are ports of the same-named functions in the reference
| backend's api/context.ts, which were themselves ports of the
| frontend's mock server: instead of walking an in-memory array they
| load the tenant's rows through `table()` and then filter/sort/paginate
| exactly as the mock did, so response shapes and ordering are
| identical. Anything that touches the database is async.
|--------------------------------------------------------------------
*/

/*
| Re-exported here because route files routinely need `nowISO()` for
| `createdAt`/`at` fields alongside `requireUser`/`addAudit`, and a
| second import path for the same symbol just invites drift.
*/
export { nowISO };

export function query(req) {
    return req.query || {};
}

export function body(req) {
    return req.body || {};
}

export function isPlatform(user) {
    return user.role === "SUPER_ADMIN" || user.role === "PLATFORM_SUPPORT";
}

/** Authenticated caller, or 401. */
export function requireUser(req) {
    const user = req.user;
    if (!user) throw unauthorized("Unauthorized \u2014 session expired");
    return user;
}

/**
 * Authenticated caller *plus* the tenant they are allowed to touch.
 * Platform roles may address any vendor; everyone else only their own.
 */
export async function requireVendor(req, vendorId) {
    const user = requireUser(req);
    const vendor = await table("vendors").get(vendorId);
    if (!vendor) throw notFound("Vendor not found");
    if (!isPlatform(user) && user.vendorId !== vendorId) {
        throw forbidden("You do not have access to this vendor tenant");
    }
    return { user, vendor };
}

/** Second gate for collections that carry their own vendorId column. */
export function scoped(items, user, vendorId) {
    if (isPlatform(user) || !vendorId) return items;
    return items.filter((i) => i.vendorId === vendorId);
}

let ipCounter = 0;

/**
 * Appends an audit entry. The mock produced a synthetic IP; a real request
 * has one, so we use it, and we resolve the actor's name from `users` rather
 * than always writing a placeholder.
 */
export async function addAudit(req, action, entity, entityId, detail, vendorId) {
    const user = requireUser(req);
    const actor = await table("users").get(user.id);
    ipCounter += 1;
    await table("audit_logs").insert({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        vendorId: vendorId ?? user.vendorId ?? null,
        userId: user.id,
        userName: actor?.name || "\u2014",
        role: user.role,
        action,
        entity,
        entityId,
        detail,
        ip: req.ip || `172.16.${ipCounter % 250}.${(ipCounter * 7) % 254}`,
        device: "Chrome / Windows",
        at: nowISO(),
    });
}

/**
 * The workhorse behind every `GET /vendor/:vendorId/...` list endpoint:
 * tenant filter in SQL, then search / status / sort / page in JavaScript so
 * the ordering matches the mock's `localeCompare` behaviour exactly.
 */
export async function vendorList(req, collection, options = {}) {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const q = query(req);
    let items = await table(collection).all("vendorId = ?", [vendor.id]);
    if (options.extraFilters) items = items.filter(options.extraFilters);
    if (q.search) items = filterBySearch(items, options.searchKeys || [], q.search);
    if (q.status && q.status !== "ALL") items = items.filter((i) => i.status === q.status);
    const sorted = sortItems(items, q, options.sortDefault || "createdAt");
    return paginate(sorted, q);
}

/** Case-insensitive user lookup used by the auth routes. */
export async function dbUserFind(email) {
    const target = String(email || "").toLowerCase();
    return await table("users").find("LOWER(email) = ?", [target]);
}

/**
 * Strips the bcrypt hash from a user row — without it every `/auth/*`
 * response would leak it.
 */
export function sanitizeUser(user) {
    const copy = { ...user };
    delete copy.passwordHash;
    return copy;
}

export function futureDays(d) {
    return new Date(Date.now() + d * 86400000).toISOString();
}

/** `newId('inv')` -> `inv-1718000000000-a91f` */
export function newId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Monotonic-ish document numbers, matching the mock's formats. */
export function documentNumber(prefix, count) {
    return `${prefix}-${String(100000 + count + 1)}`;
}
