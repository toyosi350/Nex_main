import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { addAudit, body, query, requireVendor, vendorList } from "../middleware/context.js";
import { receivablesPayload, supplierTotals } from "../services/enrich.js";
import { badRequest, notFound } from "../errors/api.errors.js";
import { futureIn, nowISO } from "../utils/http.js";
import { computeTotals, round2 } from "../utils/money.js";
import { canTransition } from "../utils/workflow.js";

/** Mock `ctx.user.name` — the JWT only carries the id, so read the display name. */
async function userName(userId) {
    return (await table("users").get(userId))?.name || "You";
}

/* ================= INVOICES ================= */

export const listInvoices = asyncHandler(async (req, res) => {
    const list = await vendorList(req, "invoices", {
        searchKeys: ["number", "customerName"],
        sortDefault: "createdAt",
    });
    const items = list.items.map((i) => ({ ...i, outstanding: round2(Math.max(0, i.total - i.amountPaid)) }));

    return res.json({
        success: true,
        data: {
            ...list,
            items,
        },
    });
});

export const getInvoice = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const i = await table("invoices").find("id = ? AND vendorId = ?", [req.params.invoiceId, req.params.vendorId]);
    if (!i) throw notFound("Invoice not found");
    const customer = await table("customers").get(i.customerId);

    return res.json({
        success: true,
        data: {
            ...i,
            outstanding: round2(Math.max(0, i.total - i.amountPaid)),
            customer,
        },
    });
});

export const createInvoice = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.customerId || !b.lines?.length) throw badRequest("Customer and at least one line are required");
    const num = 10001 + (await table("invoices").count("vendorId = ?", [vendor.id]));
    const inv = {
        id: `inv-${Date.now()}`,
        number: `INV-${String(num)}`,
        vendorId: vendor.id,
        customerId: b.customerId,
        customerName: b.customerName || "",
        orderId: b.orderId || null,
        lines: b.lines.map((l) => ({ ...l })),
        discountType: b.discountType || "FIXED",
        discountValue: Number(b.discountValue) || 0,
        taxRate: Number(b.taxRate) || 7.5,
        status: b.status || "DRAFT",
        dueDate: b.dueDate || futureIn(30, 15),
        createdAt: nowISO(),
        issuedAt: b.status === "SENT" ? nowISO() : null,
        issuedBy: user.id,
        amountPaid: 0,
        payments: [],
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "INVOICE_CREATED",
                title: "Invoice created",
                at: nowISO(),
                by: await userName(user.id),
            },
        ],
    };
    const customer = await table("customers").get(b.customerId);
    inv.customerName = inv.customerName || customer?.company || `${customer?.firstName} ${customer?.lastName}`;
    inv.paymentTerms = b.paymentTerms || customer?.paymentTerms || "NET30";
    Object.assign(inv, computeTotals(inv));
    await table("invoices").insert(inv);
    await addAudit(req, "created", "invoice", inv.id, `Created invoice ${inv.number}`, vendor.id);

    return res.json({ success: true, data: inv });
});

export const updateInvoice = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const i = await table("invoices").find("id = ? AND vendorId = ?", [req.params.invoiceId, req.params.vendorId]);
    if (!i) throw notFound("Invoice not found");
    const b = body(req);
    const patch = {};
    const allowed = ["lines", "discountType", "discountValue", "taxRate", "dueDate", "paymentTerms"];
    for (const k of allowed) {
        if (b?.[k] !== undefined) patch[k] = b[k];
    }
    Object.assign(patch, computeTotals({ ...i, ...patch }));
    const updated = await table("invoices").update(i.id, patch);

    return res.json({ success: true, data: updated });
});

const INVOICE_MAP = {
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
    PARTIALLY_PAID: ["PAID", "OVERDUE"],
    PAID: [],
    OVERDUE: ["PARTIALLY_PAID", "PAID"],
    CANCELLED: [],
};

export const transitionInvoice = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const i = await table("invoices").find("id = ? AND vendorId = ?", [req.params.invoiceId, vendor.id]);
    if (!i) throw notFound("Invoice not found");
    const to = body(req).to;
    if (!canTransition(INVOICE_MAP, i.status, to)) throw badRequest(`Invalid invoice transition ${i.status} → ${to}`);
    const patch = {
        status: to,
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "INVOICE_STATUS",
                title: `Invoice marked ${to}`,
                at: nowISO(),
                by: await userName(user.id),
            },
            ...(i.activity || []),
        ],
    };
    if (to === "SENT") patch.issuedAt = nowISO();
    const updated = await table("invoices").update(i.id, patch);
    await addAudit(req, "updated", "invoice", i.id, `Invoice ${i.number} → ${to}`, vendor.id);

    return res.json({ success: true, data: updated });
});

export const addPayment = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const i = await table("invoices").find("id = ? AND vendorId = ?", [req.params.invoiceId, vendor.id]);
    if (!i) throw notFound("Invoice not found");
    const b = body(req);
    const amount = Number(b.amount);
    if (!amount || amount <= 0) throw badRequest("A valid payment amount is required");
    const outstanding = i.total - i.amountPaid;
    if (amount > outstanding + 0.01) throw badRequest("Payment exceeds invoice outstanding balance");
    const pay = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        number: `PAY-${String(100000 + (await table("payments").count()) + 1)}`,
        vendorId: vendor.id,
        customerId: i.customerId,
        customerName: i.customerName,
        invoiceId: i.id,
        invoiceNumber: i.number,
        amount: round2(amount),
        method: b.method || "BANK_TRANSFER",
        reference: b.reference || `TXN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        status: "PAID",
        paidAt: nowISO(),
        receivedBy: user.id,
        createdAt: nowISO(),
    };
    await table("payments").insert(pay);
    const amountPaid = round2(i.amountPaid + amount);
    const left = round2(i.total - amountPaid);
    let status = i.status;
    if (left <= 0.01) status = "PAID";
    else if (i.status === "SENT" || i.status === "OVERDUE") status = "PARTIALLY_PAID";
    const updated = await table("invoices").update(i.id, {
        payments: [...(i.payments || []), pay],
        amountPaid,
        status,
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "PAYMENT_RECEIVED",
                title: `Payment ₦${Number(amount).toLocaleString("en-NG")}`,
                at: nowISO(),
                by: await userName(user.id),
            },
            ...(i.activity || []),
        ],
    });
    await addAudit(
        req,
        "recorded payment for",
        "invoice",
        i.id,
        `Payment ₦${Number(amount).toLocaleString("en-NG")} on ${i.number}`,
        vendor.id
    );

    return res.json({
        success: true,
        data: { payment: pay, invoice: { ...updated, outstanding: Math.max(0, left) } },
    });
});

/* ================= PAYMENTS ================= */

export const listPayments = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "payments", {
        searchKeys: ["number", "reference", "customerName", "invoiceNumber"],
        sortDefault: "createdAt",
    });

    return res.json({ success: true, data: result });
});

/* ================= RECEIVABLES / PAYABLES ================= */

export const getReceivables = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const data = await receivablesPayload(vendor.id, query(req));

    return res.json({ success: true, data });
});

export const listPayables = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const suppliers = await table("suppliers").all("vendorId = ?", [vendor.id]);
    const items = await Promise.all(
        suppliers.map(async (s) => {
            const { total, paid } = await supplierTotals(s.id);
            return {
                supplierId: s.id,
                supplierName: s.name,
                totalOrdered: total,
                paid,
                outstanding: round2(total - paid),
            };
        })
    );
    const outstanding = items.reduce((s, x) => s + x.outstanding, 0);

    return res.json({
        success: true,
        data: {
            totalOrdered: round2(items.reduce((s, x) => s + x.totalOrdered, 0)),
            totalPaid: round2(items.reduce((s, x) => s + x.paid, 0)),
            outstanding: round2(outstanding),
            items: items.filter((x) => x.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding),
        },
    });
});
