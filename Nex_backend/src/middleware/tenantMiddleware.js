import { forbidden, unauthorized } from "../errors/api.errors.js";
import { isPlatform } from "./context.js";

/*
|--------------------------------------------------------------------
| Tenant isolation for /vendor/:vendorId/... routes.
|
| Platform roles may address any vendor; everyone else only their own.
| Route files that resolve the vendor through `requireVendor` in the
| handler already get the same check — this middleware is the
| declarative form for routes that want it applied up front:
|
|     router.get("/:vendorId/orders", authenticate, requireTenant, handler)
|--------------------------------------------------------------------
*/

export const requireTenant = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return next(unauthorized("Authentication required"));
    }

    const vendorId = req.params.vendorId;

    /* routes without a vendor-scoped URL decide tenancy themselves */
    if (!vendorId) {
        return next();
    }

    if (!isPlatform(user) && user.vendorId !== vendorId) {
        return next(
            forbidden("You do not have access to this vendor tenant")
        );
    }

    return next();
};

export default requireTenant;
