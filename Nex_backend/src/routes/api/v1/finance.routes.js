import express from "express";

import {
    listInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    transitionInvoice,
    addPayment,
    listPayments,
    getReceivables,
    listPayables,
} from "../../../controllers/finance.controller.js";

/**
 * Finance domain: invoices, payments and the receivables / payables ledgers.
 *
 * Port of server.js lines 1310-1537 (INVOICES, PAYMENTS and
 * RECEIVABLES / PAYABLES sections). Paths, payloads, validation messages and
 * status codes mirror the mock 1:1.
 */
const router = express.Router();

/* ================= INVOICES ================= */

router.get("/vendor/:vendorId/invoices", listInvoices);
router.get("/vendor/:vendorId/invoices/:invoiceId", getInvoice);
router.post("/vendor/:vendorId/invoices", createInvoice);
router.patch("/vendor/:vendorId/invoices/:invoiceId", updateInvoice);
router.post("/vendor/:vendorId/invoices/:invoiceId/transition", transitionInvoice);
router.post("/vendor/:vendorId/invoices/:invoiceId/payments", addPayment);

/* ================= PAYMENTS ================= */

router.get("/vendor/:vendorId/payments", listPayments);

/* ================= RECEIVABLES / PAYABLES ================= */
/*
 * The mock defines local `aging` / `supplierTotals` helpers here; both live in
 * `../enrich` and produce byte-identical output, so the receivables endpoint
 * delegates to `receivablesPayload` (a verbatim copy of the mock's handler
 * body) instead of duplicating the aggregation.
 */

router.get("/vendor/:vendorId/accounting/receivables", getReceivables);
router.get("/vendor/:vendorId/accounting/payables", listPayables);

export default router;
