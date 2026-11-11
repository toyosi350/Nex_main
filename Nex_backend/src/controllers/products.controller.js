import asyncHandler from "../middleware/async.middleware.js";
import table from "../repositories/table.js";

/*
|--------------------------------------------------------------------
| MARKETPLACE CATALOG
|
| GET /products serves the archived 32-product catalog the Nex-IV
| storefront lists (row shape == the archived Products.js objects).
| `position` is the file's own ordering, kept out of the response.
|--------------------------------------------------------------------
*/

export const listProducts = asyncHandler(async (req, res) => {
    const rows = await table("marketplace_products").all(undefined, [], {
        order: "position ASC",
    });

    return res.json({
        success: true,
        data: rows.map(({ position, ...product }) => product),
    });
});
