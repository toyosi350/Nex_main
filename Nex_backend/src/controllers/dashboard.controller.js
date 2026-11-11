import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { inMonth, monthSeries, monthShort } from "../utils/http.js";
import { round2 } from "../utils/money.js";
import { requireVendor } from "../middleware/context.js";
import { getPayables, invoiceOutstanding } from "../services/enrich.js";

export const getDashboard = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const vid = vendor.id;
    const invoices = (await table("invoices").all("vendorId = ?", [vid])).filter((i) => i.status !== "CANCELLED");
    const expenses = (await table("expenses").all("vendorId = ?", [vid])).filter(
        (e) => e.status !== "REJECTED" && e.status !== "DRAFT"
    );
    const sales = invoices.reduce((s, i) => s + i.total, 0);
    const collected = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const receivables = invoiceOutstanding(invoices);
    const payables = (await getPayables(vid)).total;
    const stock = await table("stock").all("vendorId = ?", [vid]);
    const lowStock = await Promise.all(
        stock
            .filter((s) => s.available <= s.reorderLevel)
            .map(async (s) => {
                const p = await table("products").get(s.productId);
                const w = await table("warehouses").get(s.warehouseId);
                return { ...s, productName: p?.name, sku: p?.sku, warehouseName: w?.name };
            })
    );
    const overdueInv = invoices
        .filter((i) => i.status !== "PAID" && new Date(i.dueDate) < new Date())
        .map((i) => ({ ...i, outstanding: round2(Math.max(0, i.total - i.amountPaid)) }));
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);
    const recentOrders = [...(await table("orders").all("vendorId = ?", [vid]))]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);
    const activities = [
        ...(await table("audit_logs").all("vendorId = ?", [vid]))
            .slice(0, 8)
            .map((a) => ({ id: a.id, title: a.detail, type: "AUDIT", at: a.at })),
        ...invoices
            .slice(0, 4)
            .map((i) => ({
                id: `act-i-${i.id}`,
                title: `Invoice ${i.number} created`,
                type: "INVOICE",
                at: i.createdAt,
            })),
    ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 10);
    const salesSeries = monthSeries(12, (d) => {
        const mInv = invoices.filter((i) => inMonth(new Date(i.createdAt), d));
        return {
            label: monthShort(d),
            revenue: round2(mInv.reduce((s, i) => s + i.total, 0)),
            collected: round2(mInv.reduce((s, i) => s + i.amountPaid, 0)),
        };
    });
    const expenseSeries = monthSeries(12, (d) => {
        const mExp = expenses.filter((e) => inMonth(new Date(e.createdAt), d));
        return { label: monthShort(d), expenses: round2(mExp.reduce((s, e) => s + e.amount, 0)) };
    });
    const ordersOpen = (await table("orders").all("vendorId = ?", [vid])).filter((o) =>
        ["PENDING", "CONFIRMED", "RESERVED"].includes(o.status)
    ).length;

    return res.json({
        success: true,
        data: {
            metrics: {
                sales: round2(sales),
                expenses: expenseTotal,
                grossProfit: round2(sales - expenseTotal),
                customers: await table("customers").count("vendorId = ?", [vid]),
                products: await table("products").count("vendorId = ?", [vid]),
                inventoryValue: round2(stock.reduce((s, r) => s + (r.available + r.incoming) * r.unitCost, 0)),
                outstandingInvoices: receivables,
                payables,
                receivables,
                collected,
                lowStockCount: lowStock.length,
                overdueCount: overdueInv.length,
                openQuotes: await table("quotes").count("vendorId = ? AND status = 'SENT'", [vid]),
                openOrders: ordersOpen,
                invoicesSent: invoices.filter((i) => ["SENT", "OVERDUE"].includes(i.status)).length,
            },
            salesSeries,
            expenseSeries,
            lowStock,
            overdueInvoices: overdueInv,
            recentInvoices,
            recentOrders,
            activities,
        },
    });
});
