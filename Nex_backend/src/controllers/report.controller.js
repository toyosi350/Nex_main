import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { query, requireVendor } from "../middleware/context.js";
import { dates, inMonth, inRange, monthSeries, monthShort } from "../utils/http.js";
import { round2 } from "../utils/money.js";
import { enrichCustomer, enrichProduct, enrichSupplier } from "../services/enrich.js";
import { notFound } from "../errors/api.errors.js";

/* ================= REPORTS ================= */

export const getReport = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const vid = vendor.id;
    const range = dates(query(req));
    const inR = (d) => (range ? inRange(new Date(d.createdAt), range.from, range.to) : true);

    switch (req.params.reportType) {
        case "sales": {
            const inv = (await table("invoices").all("vendorId = ?", [vid])).filter((i) => inR(i));
            const total = inv.reduce((s, i) => s + i.total, 0);
            const collected = inv.reduce((s, i) => s + i.amountPaid, 0);
            const orders = (await table("orders").all("vendorId = ?", [vid])).filter((o) => inR(o));
            return res.json({
                success: true,
                data: {
                    summary: {
                        totalSales: round2(total),
                        collected: round2(collected),
                        outstanding: round2(total - collected),
                        invoiceCount: inv.length,
                        orderCount: orders.length,
                        averageOrder: round2(orders.length ? total / orders.length : 0),
                    },
                    series: monthSeries(8, (d) => {
                        const m = inv.filter((i) => inMonth(new Date(i.createdAt), d));
                        return {
                            label: monthShort(d),
                            revenue: round2(m.reduce((s, i) => s + i.total, 0)),
                            collected: round2(m.reduce((s, i) => s + i.amountPaid, 0)),
                        };
                    }),
                    items: [...inv]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 200),
                },
            });
        }
        case "purchases": {
            const pos = (await table("purchase_orders").all("vendorId = ?", [vid])).filter((p) => inR(p));
            const items = [...pos]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 200)
                .map((po) => ({
                    ...po,
                    total: round2((po.lines || []).reduce((s, l) => s + l.quantity * l.unitCost, 0)),
                }));
            return res.json({
                success: true,
                data: {
                    summary: {
                        poCount: pos.length,
                        totalOrdered: round2(items.reduce((s, x) => s + x.total, 0)),
                        received: pos.filter((p) => p.status === "RECEIVED").length,
                        pending: pos.filter((p) =>
                            ["PENDING_APPROVAL", "APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(p.status),
                        ).length,
                    },
                    items,
                },
            });
        }
        case "inventory": {
            const low = (await table("stock").all("vendorId = ?", [vid])).filter(
                (s) => s.available <= s.reorderLevel
            );
            const products = await Promise.all(
                (await table("products").all("vendorId = ?", [vid])).map(enrichProduct)
            );
            return res.json({
                success: true,
                data: {
                    summary: {
                        totalSKUs: products.length,
                        totalValue: round2(products.reduce((s, p) => s + p.inventoryValue, 0)),
                        lowStock: low.length,
                        outOfStock: products.filter((p) => p.available + p.incoming === 0).length,
                    },
                    items: products,
                },
            });
        }
        case "expenses": {
            const exps = (await table("expenses").all("vendorId = ?", [vid])).filter(
                (e) => e.status !== "REJECTED" && inR(e)
            );
            const byCategory = {};
            exps.forEach((e) => {
                byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
            });
            return res.json({
                success: true,
                data: {
                    summary: {
                        totalExpenses: round2(exps.reduce((s, e) => s + e.amount, 0)),
                        count: exps.length,
                        approved: exps.filter((e) =>
                            ["APPROVED", "PROCESSED", "PAID"].includes(e.status),
                        ).length,
                        pending: exps.filter((e) => e.status === "SUBMITTED").length,
                    },
                    byCategory: Object.entries(byCategory).map(([name, value]) => ({
                        name,
                        value: round2(value),
                    })),
                    items: [...exps]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 200),
                },
            });
        }
        case "customers": {
            const customers = await Promise.all(
                (await table("customers").all("vendorId = ?", [vid])).map(enrichCustomer)
            );
            return res.json({
                success: true,
                data: {
                    summary: {
                        total: customers.length,
                        active: customers.filter((c) => c.status === "ACTIVE").length,
                        outstanding: round2(customers.reduce((s, c) => s + c.outstanding, 0)),
                        totalLifetime: round2(customers.reduce((s, c) => s + c.totalInvoiced, 0)),
                    },
                    items: customers
                        .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
                        .slice(0, 200),
                },
            });
        }
        case "suppliers":
            return res.json({
                success: true,
                data: {
                    summary: { total: await table("suppliers").count("vendorId = ?", [vid]) },
                    items: await Promise.all(
                        (await table("suppliers").all("vendorId = ?", [vid])).map(enrichSupplier)
                    ),
                },
            });
        case "employees":
            return res.json({
                success: true,
                data: {
                    summary: { total: await table("employees").count("vendorId = ?", [vid]) },
                    items: await table("employees").all("vendorId = ?", [vid]),
                },
            });
        case "financial":
        case "tax": {
            const inv = (await table("invoices").all("vendorId = ?", [vid])).filter((i) => inR(i));
            const tax = inv.reduce((s, i) => s + i.tax, 0);
            return res.json({
                success: true,
                data: {
                    summary: {
                        revenue: round2(inv.reduce((s, i) => s + i.total, 0)),
                        taxCollected: round2(tax),
                        invoiceCount: inv.length,
                    },
                    items: [...inv]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 200),
                },
            });
        }
        default:
            throw notFound("Unknown report type");
    }
});
