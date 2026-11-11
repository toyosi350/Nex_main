import express from "express";

import {
    listInventory,
    inventorySummary,
    listStockAdjustments,
    createStockAdjustment,
    listStockTransfers,
    createStockTransfer,
    transitionStockTransfer,
} from "../../../controllers/inventory.controller.js";

/**
 * STOCK / ADJUSTMENTS / TRANSFERS — port of services/mock/server.js lines
 * 927-1090. Paths are the mock's full paths, carried verbatim.
 */
const router = express.Router();

/* ================= STOCK / ADJUSTMENTS / TRANSFERS ================= */

router.get("/vendor/:vendorId/inventory", listInventory);
router.get("/vendor/:vendorId/inventory/summary", inventorySummary);
router.get("/vendor/:vendorId/stock-adjustments", listStockAdjustments);
router.post("/vendor/:vendorId/stock-adjustments", createStockAdjustment);
router.get("/vendor/:vendorId/stock-transfers", listStockTransfers);
router.post("/vendor/:vendorId/stock-transfers", createStockTransfer);
router.post(
    "/vendor/:vendorId/stock-transfers/:transferId/transition",
    transitionStockTransfer
);

export default router;
