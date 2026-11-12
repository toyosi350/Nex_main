import table from "../repositories/table.js";
import { round2 } from "../utils/money.js";
import { sortItems } from "../utils/http.js";

/*
|--------------------------------------------------------------------
| Derived-read helpers shared by several route groups.
|
| The mock keeps these as functions over the in-memory arrays; here
| they read through `table()` and produce byte-identical numbers.
|--------------------------------------------------------------------
*/

export async function enrichCustomer(c) {
    const invoices = await table("invoices").all("customerId = ?", [c.id]);
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.reduce((s, i) => s + i.amountPaid, 0);
    return {
        ...c,
        totalInvoiced: round2(totalInvoiced),
        paidAmount: round2(paid),
        outstanding: round2(totalInvoiced - paid),
        invoiceCount: invoices.length,
        orderCount: await table("orders").count("customerId = ?", [c.id]),
    };
}

export async function enrichSupplier(s) {
    const pos = await table("purchase_orders").all("supplierId = ?", [s.id]);
    const lineSum = (po) => (po.lines || []).reduce((x, l) => x + l.quantity * l.unitCost, 0);
    const totalOrdered = pos.reduce((sum, p) => sum + lineSum(p), 0);
    return {
        ...s,
        productCount: (s.products || []).length,
        totalOrdered: round2(totalOrdered),
        poCount: pos.length,
    };
}

export async function enrichProduct(p) {
    const stockRows = await table("stock").all("productId = ?", [p.id]);
    const available = stockRows.reduce((s, r) => s + r.available, 0);
    const reserved = stockRows.reduce((s, r) => s + r.reserved, 0);
    const incoming = stockRows.reduce((s, r) => s + r.incoming, 0);
    const damaged = stockRows.reduce((s, r) => s + r.damaged, 0);
    return {
        ...p,
        available,
        reserved,
        incoming,
        damaged,
        stockRows,
        inventoryValue: round2((available + incoming) * p.costPrice),
    };
}

export async function productImagesOf(productId) {
    const rows = await table("product_images").all("productId = ?", [productId], {
        order: "position, createdAt",
    });
    return rows.map((r) => r.url);
}

/** Splits receivables/payables into overdue buckets by due date. */
export function aging(bucket, dueKey = "dueDate") {
    const now = Date.now();
    const day = 86400000;
    const overdueBy = (x) => (x[dueKey] ? now - new Date(x[dueKey]).getTime() : null);
    const bucketOf = (x) => {
        const diff = overdueBy(x);
        if (diff === null) return null;
        if (diff <= 0) return "current";
        if (diff <= 30 * day) return "days30";
        if (diff <= 60 * day) return "days60";
        if (diff <= 90 * day) return "days90";
        return "days90plus";
    };
    const out = { current: [], days30: [], days60: [], days90: [], days90plus: [] };
    for (const x of bucket) {
        const key = bucketOf(x);
        if (key) out[key].push(x);
    }
    return out;
}

/**
 * Mock-derived supplier totals: a purchase order is treated as 85% paid once
 * received and 40% once partially received. Kept verbatim so payables numbers
 * match what the UI already shows.
 */
export async function supplierTotals(supplierId) {
    const pos = await table("purchase_orders").all(
        "supplierId = ? AND status != 'CANCELLED'",
        [supplierId]
    );
    return pos.reduce(
        (acc, po) => {
            const total = round2((po.lines || []).reduce((s, l) => s + l.quantity * l.unitCost, 0));
            acc.total += total;
            acc.paid += round2(
                total * (po.status === "RECEIVED" ? 0.85 : po.status === "PARTIALLY_RECEIVED" ? 0.4 : 0)
            );
            return acc;
        },
        { total: 0, paid: 0 }
    );
}

/** Outstanding money owed to suppliers, summed per vendor. */
export async function getPayables(vendorId) {
    const suppliers = await table("suppliers").all("vendorId = ?", [vendorId]);
    let total = 0;
    for (const s of suppliers) {
        const { total: t, paid } = await supplierTotals(s.id);
        total += t - paid;
    }
    return { total: round2(total) };
}

export function invoiceOutstanding(invoices) {
    return round2(invoices.reduce((s, i) => s + Math.max(0, i.total - i.amountPaid), 0));
}

/** Shared shape of the receivables payload. */
export async function receivablesPayload(vendorId, q) {    const invoices = (await table("invoices").all("vendorId = ?", [vendorId]))
        .filter((i) => i.status !== "CANCELLED" && i.status !== "PAID" && i.status !== "DRAFT")
        .map((i) => {
            const days = Math.round((Date.now() - new Date(i.dueDate).getTime()) / 86400000);
            return {
                invoiceId: i.id,
                invoiceNumber: i.number,
                customerId: i.customerId,
                customerName: i.customerName,
                dueDate: i.dueDate,
                total: i.total,
                paid: i.amountPaid,
                outstanding: round2(Math.max(0, i.total - i.amountPaid)),
                daysOverdue: days > 0 ? days : 0,
            };
        })
        .filter((x) => x.outstanding > 0);

    const buckets = aging(invoices);
    const sum = (rows) => round2(rows.reduce((s, b) => s + b.outstanding, 0));

    return {
        totalInvoiced: round2(invoices.reduce((s, x) => s + x.total, 0)),
        totalPaid: round2(invoices.reduce((s, x) => s + x.paid, 0)),
        outstanding: round2(invoices.reduce((s, x) => s + x.outstanding, 0)),
        overdue: round2(invoices.filter((x) => x.daysOverdue > 0).reduce((s, x) => s + x.outstanding, 0)),
        agingByStatus: {
            current: sum(buckets.current),
            days30: sum(buckets.days30),
            days60: sum(buckets.days60),
            days90: sum(buckets.days90),
            days90plus: sum(buckets.days90plus),
        },
        items: sortItems(invoices, q, "dueDate").slice(0, Number(q.limit) || 50),
    };
}
