import { forbidden, unauthorized } from "../errors/api.errors.js";

/*
|--------------------------------------------------------------------
| Role-based access control.
|
| Roles arrive as claims on the access token (see auth.middleware.js),
| so this is a pure string check — no database round trip. Chain it
| after `authenticate`:
|
|     router.delete("/:id", authenticate, requireRole("SUPER_ADMIN"), handler)
|--------------------------------------------------------------------
*/

export const requireRole =
    (...roles) =>
    (req, res, next) => {
        if (!req.user) {
            return next(unauthorized("Authentication required"));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                forbidden("You do not have permission to perform this action")
            );
        }

        return next();
    };

export default requireRole;
