import asyncHandler from "../middleware/async.middleware.js";
import table from "../repositories/table.js";
import { addAudit, body, requireVendor, vendorList } from "../middleware/context.js";
import { badRequest, notFound } from "../errors/api.errors.js";
import { futureIn, nowISO } from "../utils/http.js";
import { computeTotals } from "../utils/money.js";
import { canTransition } from "../utils/workflow.js";

/*
|--------------------------------------------------------------------
| Sales domain: quotes and sales orders.
|
| Port of server.js lines 1091-1309 (QUOTES + ORDERS sections). Paths,
| payloads, validation messages and status codes mirror the mock 1:1.
|--------------------------------------------------------------------
*/

/** Mock `ctx.user.name` — the JWT only carries the id, so read the display name. */
async function userName(userId) {
    return (await table("users").get(userId))?.name || "You";
}

/* ================= QUOTES ================= */

export const listQuotes = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "quotes", {
        searchKeys: ["number", "customerName"],
        sortDefault: "createdAt",
    });

    return res.json({
        success: true,
        data: { ...result, items: result.items.map((q) => ({ ...q })) },
    });
});

export const getQuote = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));

    const q = await table("quotes").find("id = ? AND vendorId = ?", [
        req.params.quoteId,
        req.params.vendorId,
    ]);
    if (!q) throw notFound("Quote not found");

    return res.json({
        success: true,
        data: { ...q, customer: await table("customers").get(q.customerId) },
    });
});

export const createQuote = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.customerId || !b.lines?.length) throw badRequest("Customer and at least one line are required");
    const customer = await table("customers").find("id = ? AND vendorId = ?", [b.customerId, vendor.id]);
    const seq = (await table("quotes").count("vendorId = ?", [vendor.id])) + 1;
    const q = {
        id: `qt-${Date.now()}`,
        number: `QUOTE-${String(100000 + seq).slice(1)}`,
        vendorId: vendor.id,
        customerId: b.customerId,
        customerName: customer?.company || `${customer?.firstName} ${customer?.lastName}`,
        lines: b.lines.map((l) => ({ ...l })),
        discountType: b.discountType || "FIXED",
        discountValue: Number(b.discountValue) || 0,
        taxRate: Number(b.taxRate) || 7.5,
        status: b.status || "DRAFT",
        validUntil: b.validUntil || futureIn(21, 7),
        createdAt: nowISO(),
        issuedBy: user.id,
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "QUOTE_CREATED",
                title: "Quote created",
                at: nowISO(),
                by: await userName(user.id),
            },
        ],
    };
    Object.assign(q, computeTotals(q));
    await table("quotes").insert(q);
    await addAudit(req, "created", "quote", q.id, `Created quote ${q.number}`, vendor.id);

    return res.json({
        success: true,
        data: q,
    });
});

export const updateQuote = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const q = await table("quotes").find("id = ? AND vendorId = ?", [req.params.quoteId, vendor.id]);
    if (!q) throw notFound("Quote not found");
    const b = body(req);
    const patch = {};
    const allowed = ["customerId", "lines", "discountType", "discountValue", "taxRate", "validUntil"];
    for (const k of allowed) {
        if (b?.[k] !== undefined) patch[k] = b[k];
    }
    if (b?.customerId) {
        const customer = await table("customers").get(b.customerId);
        patch.customerName = customer?.company || `${customer?.firstName} ${customer?.lastName}`;
    }
    Object.assign(patch, computeTotals({ ...q, ...patch }));

    return res.json({
        success: true,
        data: await table("quotes").update(q.id, patch),
    });
});

const QUOTE_MAP = { DRAFT: ["SENT", "REJECTED"], SENT: ["ACCEPTED", "REJECTED", "EXPIRED"], ACCEPTED: [], REJECTED: [], EXPIRED: [] };

export const transitionQuote = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const q = await table("quotes").find("id = ? AND vendorId = ?", [req.params.quoteId, vendor.id]);
    if (!q) throw notFound("Quote not found");
    const to = body(req).to;
    if (!canTransition(QUOTE_MAP, q.status, to)) throw badRequest(`Invalid quote transition ${q.status} → ${to}`);
    const activity = [
        {
            id: `act-${Date.now()}`,
            type: `QUOTE_${to}`,
            title: `Quote ${to.toLowerCase()}`,
            at: nowISO(),
            by: await userName(user.id),
        },
        ...(q.activity || []),
    ];
    const updated = await table("quotes").update(q.id, { status: to, activity });
    await addAudit(req, "updated", "quote", q.id, `Quote ${q.number} → ${to}`, vendor.id);

    return res.json({
        success: true,
        data: updated,
    });
});

export const convertQuote = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const q = await table("quotes").find("id = ? AND vendorId = ?", [req.params.quoteId, vendor.id]);
    if (!q) throw notFound("Quote not found");
    if (q.status !== "ACCEPTED") throw badRequest("Only accepted quotes can be converted to orders");
    const order = {
        id: `ord-${Date.now()}`,
        number: `SO-${String(100000 + (await table("orders").count("vendorId = ?", [vendor.id])) + 1)}`,
        vendorId: vendor.id,
        customerId: q.customerId,
        customerName: q.customerName,
        quoteId: q.id,
        lines: q.lines.map((l) => ({ ...l })),
        status: "PENDING",
        subtotal: q.subtotal,
        discount: q.discount,
        taxable: q.taxable,
        tax: q.tax,
        total: q.total,
        createdAt: nowISO(),
        orderedAt: nowISO(),
        expectedDelivery: body(req).expectedDelivery || futureIn(14, 3),
        issuedBy: user.id,
        payments: [],
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "ORDER_CREATED",
                title: "Order created from quote",
                at: nowISO(),
                by: await userName(user.id),
            },
        ],
    };
    await table("orders").insert(order);
    const activity = [
        {
            id: `act-${Date.now()}`,
            type: "ORDER_CREATED",
            title: "Converted to sales order",
            at: nowISO(),
            by: await userName(user.id),
        },
        ...(q.activity || []),
    ];
    await table("quotes").update(q.id, { activity });
    await addAudit(req, "converted", "quote", q.id, `Converted ${q.number} to ${order.number}`, vendor.id);

    return res.json({
        success: true,
        data: order,
    });
});

/* ================= ORDERS ================= */

export const listOrders = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "orders", {
        searchKeys: ["number", "customerName"],
        sortDefault: "createdAt",
    });

    return res.json({
        success: true,
        data: result,
    });
});

export const getOrder = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));

    const o = await table("orders").find("id = ? AND vendorId = ?", [
        req.params.orderId,
        req.params.vendorId,
    ]);
    if (!o) throw notFound("Order not found");
    const inv = await table("invoices").find("orderId = ?", [o.id]);

    return res.json({
        success: true,
        data: { ...o, customer: await table("customers").get(o.customerId), invoice: inv || null },
    });
});

export const createOrder = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.customerId || !b.lines?.length) throw badRequest("Customer and at least one line are required");
    const customer = await table("customers").find("id = ? AND vendorId = ?", [b.customerId, vendor.id]);
    const lines = b.lines.map((l) => ({ ...l }));
    const order = {
        id: `ord-${Date.now()}`,
        number: `SO-${String(100000 + (await table("orders").count("vendorId = ?", [vendor.id])) + 1)}`,
        vendorId: vendor.id,
        customerId: b.customerId,
        customerName: customer?.company || `${customer?.firstName} ${customer?.lastName}`,
        quoteId: b.quoteId || null,
        lines,
        status: "PENDING",
        subtotal: 0,
        discount: 0,
        taxable: 0,
        tax: 0,
        total: 0,
        createdAt: nowISO(),
        orderedAt: nowISO(),
        expectedDelivery: b.expectedDelivery || futureIn(14, 3),
        issuedBy: user.id,
        payments: [],
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "ORDER_CREATED",
                title: "Sales order created",
                at: nowISO(),
                by: await userName(user.id),
            },
        ],
    };
    Object.assign(order, computeTotals(order));
    await table("orders").insert(order);
    await addAudit(req, "created", "order", order.id, `Created sales order ${order.number}`, vendor.id);

    return res.json({
        success: true,
        data: order,
    });
});

const ORDER_MAP = { DRAFT: ["PENDING", "CANCELLED"], PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["RESERVED", "FULFILLED", "CANCELLED"], RESERVED: ["FULFILLED", "CANCELLED"], FULFILLED: [], CANCELLED: [] };

/* Mirror of the storefront's auto-advance helper (server.js advanceShopOrder),
   kept local so the linked marketplace order stays in sync without importing
   another route module. Constants come from frontend constants/shop.js. */
const SHOP_STATUS_FLOW = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const SHOP_STATUS_LABELS = {
    PLACED: "Order placed",
    CONFIRMED: "Order confirmed",
    PROCESSING: "Packed & processing",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURNED: "Returned",
};
const SHOP_STAGE_GAP_MS = 90000; // mock auto-progress interval for live tracking

async function advanceShopOrder(o) {
    if (!o.autoAdvance || o.status === "CANCELLED" || o.status === "DELIVERED" || o.status === "RETURNED") return;
    const idx = SHOP_STATUS_FLOW.indexOf(o.status);
    if (idx < 0 || idx >= SHOP_STATUS_FLOW.length - 1) return;
    const timeline = o.timeline || [];
    const last = timeline[timeline.length - 1];
    const lastAt = last ? new Date(last.at).getTime() : new Date(o.createdAt).getTime();
    if (Date.now() - lastAt < SHOP_STAGE_GAP_MS) return;
    const next = SHOP_STATUS_FLOW[idx + 1];
    const patch = {
        status: next,
        timeline: [...timeline, { key: next, label: SHOP_STATUS_LABELS[next], at: nowISO() }],
    };
    if (next === "DELIVERED") patch.deliveredAt = nowISO();
    await table("shop_orders").update(o.id, patch);
}

export const transitionOrder = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, String(req.params.vendorId));
    const o = await table("orders").find("id = ? AND vendorId = ?", [req.params.orderId, vendor.id]);
    if (!o) throw notFound("Order not found");
    const to = body(req).to;
    if (!canTransition(ORDER_MAP, o.status, to)) throw badRequest(`Invalid order transition ${o.status} → ${to}`);
    const activity = [...(o.activity || [])];
    if (to === "RESERVED") {
        for (const l of o.lines || []) {
            let qty = l.quantity;
            const rows = await table("stock").all("productId = ? AND vendorId = ?", [l.productId, vendor.id]);
            for (const row of rows) {
                const take = Math.min(row.available, qty);
                if (take > 0) {
                    await table("stock").update(row.id, { available: row.available - take, reserved: row.reserved + take });
                    qty -= take;
                }
            }
        }
        activity.unshift({
            id: `act-${Date.now()}`,
            type: "STOCK_RESERVED",
            title: "Inventory reserved for order",
            at: nowISO(),
            by: await userName(user.id),
        });
    }
    if (to === "FULFILLED") {
        for (const l of o.lines || []) {
            let qty = l.quantity;
            const rows = await table("stock").all("productId = ? AND vendorId = ?", [l.productId, vendor.id]);
            for (const row of rows) {
                const release = Math.min(row.reserved, qty);
                await table("stock").update(row.id, { reserved: row.reserved - release, available: row.available - release });
                qty -= release;
            }
        }
        activity.unshift({
            id: `act-${Date.now()}`,
            type: "ORDER_FULFILLED",
            title: "Order fulfilled",
            at: nowISO(),
            by: await userName(user.id),
        });
    }
    activity.unshift({
        id: `act-${Date.now()}`,
        type: "ORDER_STATUS",
        title: `Order status → ${to}`,
        at: nowISO(),
        by: await userName(user.id),
    });
    const updated = await table("orders").update(o.id, { status: to, activity });
    await addAudit(req, "updated", "order", o.id, `Order ${o.number} → ${to}`, vendor.id);

    /* keep the linked marketplace order in sync */
    if (o.shopOrderId) {
        const shop = await table("shop_orders").find("number = ? OR id = ?", [o.shopOrderId, o.shopOrderId]);
        if (shop) {
            if (to === "FULFILLED" && shop.status === "PROCESSING") {
                await advanceShopOrder(shop);
            } else if (to === "CANCELLED") {
                await table("shop_orders").update(shop.id, {
                    status: "CANCELLED",
                    cancelledAt: nowISO(),
                    timeline: [...(shop.timeline || []), { key: "CANCELLED", label: "Cancelled", at: nowISO() }],
                    paymentStatus: shop.paymentStatus === "PAID" ? "REFUNDED" : shop.paymentStatus,
                });
            }
        }
    }

    return res.json({
        success: true,
        data: updated,
    });
});
