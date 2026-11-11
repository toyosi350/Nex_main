import express from "express";

import {
    listQuotes,
    getQuote,
    createQuote,
    updateQuote,
    transitionQuote,
    convertQuote,
    listOrders,
    getOrder,
    createOrder,
    transitionOrder,
} from "../../../controllers/sales.controller.js";

const router = express.Router();

/* ================= QUOTES ================= */

router.get("/vendor/:vendorId/quotes", listQuotes);

router.get("/vendor/:vendorId/quotes/:quoteId", getQuote);

router.post("/vendor/:vendorId/quotes", createQuote);

router.patch("/vendor/:vendorId/quotes/:quoteId", updateQuote);

router.post("/vendor/:vendorId/quotes/:quoteId/transition", transitionQuote);

router.post("/vendor/:vendorId/quotes/:quoteId/convert", convertQuote);

/* ================= ORDERS ================= */

router.get("/vendor/:vendorId/orders", listOrders);

router.get("/vendor/:vendorId/orders/:orderId", getOrder);

router.post("/vendor/:vendorId/orders", createOrder);

router.post("/vendor/:vendorId/orders/:orderId/transition", transitionOrder);

export default router;
