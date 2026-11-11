import express from "express";

import {
    listPurchaseRequests,
    createPurchaseRequest,
    transitionPurchaseRequest,
    listPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    transitionPurchaseOrder,
    receivePurchaseOrder,
    listGoodsReceipts,
} from "../../../controllers/purchase.controller.js";

/**
 * Purchasing: purchase requests, purchase orders and goods receipts.
 *
 * Port of services/mock/server.js 1538-1683 — same paths, payloads,
 * validation messages and status codes.
 */
const router = express.Router();

/* ================= PURCHASING ================= */

router.get("/vendor/:vendorId/purchase-requests", listPurchaseRequests);
router.post("/vendor/:vendorId/purchase-requests", createPurchaseRequest);
router.post(
    "/vendor/:vendorId/purchase-requests/:id/transition",
    transitionPurchaseRequest
);
router.get("/vendor/:vendorId/purchase-orders", listPurchaseOrders);
router.get("/vendor/:vendorId/purchase-orders/:poId", getPurchaseOrder);
router.post("/vendor/:vendorId/purchase-orders", createPurchaseOrder);
router.post(
    "/vendor/:vendorId/purchase-orders/:poId/transition",
    transitionPurchaseOrder
);
router.post("/vendor/:vendorId/purchase-orders/:poId/receive", receivePurchaseOrder);
router.get("/vendor/:vendorId/goods-receipts", listGoodsReceipts);

export default router;
