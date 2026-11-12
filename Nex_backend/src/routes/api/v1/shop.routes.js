import express from "express";

import {
    shopHome,
    shopCategories,
    shopDeals,
    shopVendors,
    shopVendorStore,
    shopProducts,
    shopProductDetail,
    listProductReviews,
    createProductReview,
    searchSuggest,
    registerShopper,
    loginShopper,
    shopMe,
    listAddresses,
    addAddress,
    deleteAddress,
    lookupOrder,
    listOrders,
    getOrder,
    createOrder,
    cancelOrder,
    getStorefront,
    updateStorefront,
    getStorefrontStats,
    submitVendorApplication,
    submitCareerApplication,
} from "../../../controllers/shop.controller.js";

/*
|--------------------------------------------------------------------
| Storefront routes — port of the reference backend's shop.routes.ts
| (mock server.js lines 2517-3540, `SHOP - public storefront`). Public
| catalogue endpoints plus the shopper identity space (separate from
| ERP users), addresses, reviews and the checkout write path that fans
| out into ERP orders / invoices / payments.
|
| Every path is the full mock path; the router is mounted at `/api/v1`.
|--------------------------------------------------------------------
*/

const router = express.Router();

/* ---------- home ---------- */
router.get("/shop/home", shopHome);

/* ---------- categories ---------- */
router.get("/shop/categories", shopCategories);

/* ---------- deals ---------- */
router.get("/shop/deals", shopDeals);

/* ---------- vendors ---------- */
router.get("/shop/vendors", shopVendors);
router.get("/shop/vendors/:slug", shopVendorStore);

/* ---------- products (search / filter / sort / paginate) ---------- */
router.get("/shop/products", shopProducts);
router.get("/shop/products/:idOrSlug", shopProductDetail);

/* ---------- reviews ---------- */
router.get("/shop/products/:productId/reviews", listProductReviews);
router.post("/shop/products/:productId/reviews", createProductReview);

/* ---------- search suggestions ---------- */
router.get("/shop/search/suggest", searchSuggest);

/* ---------- shopper auth ---------- */
router.post("/shop/auth/register", registerShopper);
router.post("/shop/auth/login", loginShopper);
router.get("/shop/auth/me", shopMe);

/* ---------- addresses ---------- */
router.get("/shop/addresses", listAddresses);
router.post("/shop/addresses", addAddress);
router.delete("/shop/addresses/:addressId", deleteAddress);

/* ---------- shop orders ---------- */
router.get("/shop/orders/lookup", lookupOrder);
router.get("/shop/orders", listOrders);
router.get("/shop/orders/:orderId", getOrder);
router.post("/shop/orders", createOrder);
router.post("/shop/orders/:orderId/cancel", cancelOrder);

/* ---------- public applications (Careers / Sell on Nex-IV) ---------- */
router.post("/shop/vendor-applications", submitVendorApplication);
router.post("/shop/careers/applications", submitCareerApplication);

/* ---------- ERP: storefront settings & stats ---------- */
router.get("/vendor/:vendorId/storefront", getStorefront);
router.patch("/vendor/:vendorId/storefront", updateStorefront);
router.get("/vendor/:vendorId/storefront/stats", getStorefrontStats);

export default router;
