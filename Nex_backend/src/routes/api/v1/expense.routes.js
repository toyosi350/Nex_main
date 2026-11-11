import express from "express";

import {
    listExpenses,
    createExpense,
    transitionExpense,
    financialSummary,
    cashflow,
} from "../../../controllers/expense.controller.js";

/**
 * Expenses plus the FINANCE / ACCOUNTING summary endpoints.
 *
 * Port of services/mock/server.js 1684-1814 — same paths, payloads,
 * validation messages and status codes.
 */
const router = express.Router();

/* ================= EXPENSES ================= */

router.get("/vendor/:vendorId/expenses", listExpenses);
router.post("/vendor/:vendorId/expenses", createExpense);
router.post(
    "/vendor/:vendorId/expenses/:expenseId/transition",
    transitionExpense
);

/* ================= FINANCE / ACCOUNTING ================= */

router.get("/vendor/:vendorId/accounting/financial", financialSummary);
router.get("/vendor/:vendorId/accounting/cashflow", cashflow);

export default router;
