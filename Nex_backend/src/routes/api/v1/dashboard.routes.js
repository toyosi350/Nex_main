import express from "express";

import { getDashboard } from "../../../controllers/dashboard.controller.js";

/**
 * Vendor dashboard — mock server.js lines 1815–1885.
 *
 * `invoiceOutstanding` is no longer a local helper here: it lives in
 * `../enrich` and is shared with the finance routes.
 */
const router = express.Router();

router.get("/vendor/:vendorId/dashboard", getDashboard);

export default router;
