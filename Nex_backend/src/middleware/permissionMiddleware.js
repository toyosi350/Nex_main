import table from "../repositories/table.js";
import { forbidden, unauthorized } from "../errors/api.errors.js";
import { isPlatform } from "./context.js";

/*
|--------------------------------------------------------------------
| Permission-based access control.
|
| Permission codes mirror the frontend's constants/roles.js exactly
| (seeds/001 + seeds/003 are generated from that file), so a route
| asking for "CUSTOMER_DELETE" means the same thing the UI's role
| picker means. Platform roles and the vendor admin hold every
| permission, same as the frontend's ROLE_PERMISSIONS map.
|
| A user row's own `permissions` array (the contract field) overrides
| the role mapping when present — that is how the UI resolves them too.
|--------------------------------------------------------------------
*/

const roleCache = new Map();

async function permissionsFor(user) {
    if (Array.isArray(user.permissions) && user.permissions.length) {
        return user.permissions;
    }

    const cached = roleCache.get(user.role);
    if (cached) return cached;

    const rows = await table("permissions").sql(
        `SELECT p.code
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         WHERE r.name = ?`,
        [user.role]
    );
    const codes = rows.map((r) => r.code);
    roleCache.set(user.role, codes);
    return codes;
}

export const requirePermission =
    (...codes) =>
    async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return next(unauthorized("Authentication required"));
            }

            if (isPlatform(user) || user.role === "VENDOR_ADMIN") {
                return next();
            }

            const held = await permissionsFor(user);
            const allowed = codes.every((code) => held.includes(code));

            if (!allowed) {
                return next(
                    forbidden("You do not have permission to perform this action")
                );
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };

/**
 * Drops the in-memory role -> permissions map. Call it after a roles or
 * permissions change so the next request re-reads the tables.
 */
export const invalidatePermissionCache = () => {
    roleCache.clear();
};

export default requirePermission;
