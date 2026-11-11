import { verifyAccessToken } from "../utils/jwt.js";
import table from "../repositories/table.js";

/*
|--------------------------------------------------------------------
| Token identity.
|
| Access tokens carry `{ userId, role, vendorId }` so role and tenant
| checks never need a round trip. Tokens issued before those claims
| existed fall back to a single `users` lookup, and a token whose
| user has since been deleted resolves to nothing.
|
| Two entry points:
|
|   attachUser   — app-wide, never rejects; routes that need a caller
|                  call `requireUser(req)` from middleware/context.js
|   authenticate — rejects with 401 when the request is anonymous;
|                  used by routes where every path needs a session
|--------------------------------------------------------------------
*/

async function resolveUser(req) {
    const authorization = req.headers.authorization;
    if (!authorization) return null;

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) return null;

    let payload;
    try {
        payload = verifyAccessToken(token);
    } catch {
        return null;
    }

    if (!payload?.userId) return null;

    /* storefront sessions are a separate identity space */
    if (payload.typ === "shopper") return null;

    if (payload.role !== undefined) {
        return {
            userId: payload.userId,
            id: payload.userId,
            role: payload.role,
            vendorId: payload.vendorId ?? null,
        };
    }

    /* legacy token: role/vendorId were not claims yet */
    const user = await table("users").get(payload.userId);
    if (!user) return null;

    return {
        userId: user.id,
        id: user.id,
        role: user.role,
        vendorId: user.vendorId ?? null,
    };
}

/** Attach identity when a valid token is present. Never rejects. */
export const attachUser = async (req, res, next) => {
    try {
        req.user = await resolveUser(req);
    } catch {
        req.user = null;
    }
    return next();
};

/** Same identity, but a missing/expired session is a 401. */
export const authenticate = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization format",
        });
    }

    try {
        const user = await resolveUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token",
            });
        }

        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

export default authenticate;
