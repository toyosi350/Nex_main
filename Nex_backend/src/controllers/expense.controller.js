import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { badRequest, notFound } from "../errors/api.errors.js";
import { dates, inMonth, inRange, monthSeries, monthShort, nowISO } from "../utils/http.js";
import { round2 } from "../utils/money.js";
import { canTransition } from "../utils/workflow.js";
import { addAudit, body, query, requireVendor, vendorList } from "../middleware/context.js";
import { getPayables } from "../services/enrich.js";

export const listExpenses = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "expenses", {
        searchKeys: ["number", "description", "category"],
        sortDefault: "createdAt",
    });
    return res.json({ success: true, data: result });
});

export const createExpense = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.category || !Number(b.amount))
        throw badRequest("Category and amount are required");
    const exp = {
        id: `exp-${Date.now()}`,
        number: `EXP-${String(100000 + (await table("expenses").count()) + 1)}`,
        vendorId: vendor.id,
        category: b.category,
        description: b.description || "",
        amount: Number(b.amount),
        paidTo: (b.paidTo || "").toUpperCase(),
        paymentMethod: b.paymentMethod || "BANK_TRANSFER",
        status: "DRAFT",
        submittedBy: user.id,
        submittedAt: nowISO(),
        approvedBy: null,
        approvedAt: null,
        paidAt: null,
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "EXPENSE_CREATED",
                title: "Expense draft created",
                at: nowISO(),
                by: (await table("users").get(user.id))?.name || "You",
            },
        ],
    };
    return res.json({ success: true, data: await table("expenses").insert(exp) });
});

export const transitionExpense = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const exp = await table("expenses").find("id = ? AND vendorId = ?", [
        req.params.expenseId,
        vendor.id,
    ]);
    if (!exp) throw notFound("Expense not found");
    const to = body(req).to;
    if (!canTransition(EXPENSE_MAP, exp.status, to))
        throw badRequest(`Invalid expense transition ${exp.status} → ${to}`);
    const patch = {
        status: to,
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "EXPENSE_STATUS",
                title: `Expense → ${to}`,
                at: nowISO(),
                by: (await table("users").get(user.id))?.name || "You",
            },
            ...(exp.activity || []),
        ],
    };
    if (to === "APPROVED") {
        patch.approvedBy = user.id;
        patch.approvedAt = nowISO();
    }
    if (to === "PAID") patch.paidAt = nowISO();
    const updated = await table("expenses").update(exp.id, patch);
    await addAudit(req, "updated", "expense", exp.id, `Expense ${exp.number} → ${to}`, vendor.id);
    return res.json({ success: true, data: updated });
});

const EXPENSE_MAP = {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["APPROVED", "REJECTED"],
    APPROVED: ["PROCESSED", "PAID"],
    REJECTED: [],
    PROCESSED: ["PAID"],
    PAID: [],
};

export const financialSummary = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const range = dates(query(req));
    const inv = (await table("invoices").all("vendorId = ?", [vendor.id])).filter(
        (i) => i.status !== "CANCELLED"
    );
    const exps = (await table("expenses").all("vendorId = ?", [vendor.id])).filter(
        (e) => e.status !== "REJECTED" && e.status !== "DRAFT"
    );
    const applicable = (arr, field) =>
        range ? arr.filter((x) => inRange(new Date(x[field]), range.from, range.to)) : arr;
    const revenue = round2(applicable(inv, "createdAt").reduce((s, i) => s + i.total, 0));
    const collected = round2(applicable(inv, "createdAt").reduce((s, i) => s + i.amountPaid, 0));
    const expenses = round2(applicable(exps, "createdAt").reduce((s, e) => s + e.amount, 0));
    const gross = round2(revenue - expenses);
    const receivables = round2(
        inv.filter((i) => i.status !== "PAID").reduce((s, i) => s + Math.max(0, i.total - i.amountPaid), 0)
    );
    const payablesRes = await getPayables(vendor.id);
    const cashFlow = monthSeries(12, (d) => {
        const mInv = inv.filter((i) => inMonth(new Date(i.createdAt), d));
        const mExp = exps.filter((e) => inMonth(new Date(e.createdAt), d));
        return {
            label: monthShort(d),
            inflow: round2(mInv.reduce((s, i) => s + i.amountPaid, 0)),
            outflow: round2(mExp.reduce((s, e) => s + e.amount, 0)),
        };
    });
    return res.json({
        success: true,
        data: {
            revenue,
            collected,
            outstanding: round2(revenue - collected),
            expenses,
            gross,
            net: round2(revenue - expenses),
            receivables,
            payables: payablesRes.total,
            cashFlow,
            series: monthSeries(12, (d) => {
                const mInv = inv.filter((i) => inMonth(new Date(i.createdAt), d));
                const mExp = exps.filter((e) => inMonth(new Date(e.createdAt), d));
                return {
                    label: monthShort(d),
                    revenue: round2(mInv.reduce((s, i) => s + i.total, 0)),
                    collected: round2(mInv.reduce((s, i) => s + i.amountPaid, 0)),
                    expenses: round2(mExp.reduce((s, e) => s + e.amount, 0)),
                    profit: round2(
                        mInv.reduce((s, i) => s + i.total, 0) -
                            mExp.reduce((s, e) => s + e.amount, 0)
                    ),
                };
            }),
        },
    });
});

export const cashflow = asyncHandler(async (req, res) => {
    await requireVendor(req, req.params.vendorId);
    /* monthSeries is sync; walk its 12 months and await the queries per month */
    const months = monthSeries(12, (d) => d);
    const data = [];
    for (const d of months) {
        const inv = (await table("invoices").all("vendorId = ?", [req.params.vendorId])).filter(
            (i) => inMonth(new Date(i.createdAt), d)
        );
        const exps = (await table("expenses").all("vendorId = ?", [req.params.vendorId])).filter(
            (e) => e.status !== "REJECTED" && inMonth(new Date(e.createdAt), d)
        );
        const inflow = inv.reduce((s, i) => s + i.amountPaid, 0);
        const outflow = exps.reduce((s, e) => s + e.amount, 0);
        data.push({
            label: monthShort(d),
            inflow: round2(inflow),
            outflow: round2(outflow),
            net: round2(inflow - outflow),
        });
    }
    return res.json({ success: true, data });
});
