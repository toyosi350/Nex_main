import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { badRequest, notFound } from "../errors/api.errors.js";
import { nowISO, paginate, sortItems } from "../utils/http.js";
import { round2 } from "../utils/money.js";
import { canTransition } from "../utils/workflow.js";
import { addAudit, body, query, requireVendor, vendorList } from "../middleware/context.js";
import { enrichProduct } from "../services/enrich.js";

export const listInventory = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    let rows = await table("stock").all("vendorId = ?", [vendor.id]);
    const q = query(req);
    if (q.productId) rows = rows.filter((r) => r.productId === q.productId);
    if (q.warehouseId) rows = rows.filter((r) => r.warehouseId === q.warehouseId);
    if (q.lowStock === "true") rows = rows.filter((r) => r.available <= r.reorderLevel);
    if (q.outOfStock === "true") rows = rows.filter((r) => r.available <= 0);
    rows = await Promise.all(
        rows.map(async (r) => {
            const p = await table("products").get(r.productId);
            const w = await table("warehouses").get(r.warehouseId);
            return {
                ...r,
                productName: p?.name,
                sku: p?.sku,
                productStatus: p?.status,
                warehouseName: w?.name,
                value: round2((r.available + r.incoming) * r.unitCost),
            };
        })
    );
    rows = sortItems(rows, q, "updatedAt");
    return res.json({ success: true, data: paginate(rows, q) });
});

export const inventorySummary = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const products = await table("products").all("vendorId = ? AND type = ?", [
        vendor.id,
        "PRODUCT",
    ]);
    const low = [];
    for (const p of products) {
        const rows = await table("stock").all("productId = ?", [p.id]);
        const available = rows.reduce((s, r) => s + r.available, 0);
        if (available <= p.reorderLevel) {
            low.push({ ...(await enrichProduct(p)), available });
        }
    }
    const vendorStock = await table("stock").all("vendorId = ?", [vendor.id]);
    let outOfStock = 0;
    for (const p of products) {
        const rows = await table("stock").all("productId = ?", [p.id]);
        if (rows.reduce((s, r) => s + (r.available + r.incoming), 0) === 0) outOfStock += 1;
    }
    return res.json({
        success: true,
        data: {
            totalSKUs: products.length,
            totalValue: round2(
                vendorStock.reduce((s, r) => s + (r.available + r.incoming) * r.unitCost, 0)
            ),
            lowStock: low.length,
            outOfStock,
        },
    });
});

export const listStockAdjustments = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "adjustments", {
        searchKeys: ["reason"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: {
            ...result,
            items: await Promise.all(
                result.items.map(async (a) => ({
                    ...a,
                    productName: (await table("products").get(a.productId))?.name,
                }))
            ),
        },
    });
});

export const createStockAdjustment = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.productId || !b.warehouseId || !b.type || !Number(b.quantity)) {
        throw badRequest("Product, warehouse, type and quantity are required");
    }
    // Mock: db.stock.find(s => s.productId === … && s.warehouseId === … &&
    // s.vendorId === …); resolve the id, then load through table().get() so the
    // mutations below run on a plain row object — mutate in memory, persist once.
    const found = await table("stock").find(
        "productId = ? AND warehouseId = ? AND vendorId = ?",
        [b.productId, b.warehouseId, vendor.id]
    );
    if (!found) throw notFound("Stock record not found");
    const row = await table("stock").get(String(found.id));
    const adjustment = {
        id: `adj-${Date.now()}`,
        number: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorId: vendor.id,
        productId: b.productId,
        warehouseId: b.warehouseId,
        type: b.type,
        quantity: Number(b.quantity),
        reason: b.reason || "",
        createdBy: user.id,
        createdAt: nowISO(),
    };
    await table("adjustments").insert(adjustment);
    if (["ADD", "CORRECTION"].includes(b.type)) row.available += Number(b.quantity);
    else row.available = Math.max(0, row.available - Number(b.quantity));
    row.damaged += b.type === "DAMAGED" ? Number(b.quantity) : 0;
    row.movements.unshift({
        id: `mvt-${Date.now()}`,
        type: b.type === "ADD" ? "IN" : "OUT",
        qty: Number(b.quantity),
        reason: `${b.type} tally`,
        at: nowISO(),
        userId: user.id,
    });
    await table("stock").update(row.id, {
        available: row.available,
        damaged: row.damaged,
        movements: row.movements,
    });
    await addAudit(
        req,
        "adjusted stock",
        "product",
        b.productId,
        `${b.type}: ${Number(b.quantity)} units`,
        vendor.id
    );
    return res.json({ success: true, data: adjustment });
});

export const listStockTransfers = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "transfers", {
        searchKeys: ["reference"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: {
            ...result,
            items: await Promise.all(
                result.items.map(async (t) => ({
                    ...t,
                    fromName: (await table("warehouses").get(t.fromWarehouseId))?.name,
                    toName: (await table("warehouses").get(t.toWarehouseId))?.name,
                    productName: (await table("products").get(t.productId))?.name,
                }))
            ),
        },
    });
});

export const createStockTransfer = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.productId || !b.fromWarehouseId || !b.toWarehouseId || !Number(b.quantity)) {
        throw badRequest("Product, source, destination and quantity are required");
    }
    if (b.fromWarehouseId === b.toWarehouseId)
        throw badRequest("Source and destination warehouses must differ");
    const transfer = {
        id: `tr-${Date.now()}`,
        reference: `XFER-${Math.floor(10000 + Math.random() * 90000)}`,
        vendorId: vendor.id,
        productId: b.productId,
        fromWarehouseId: b.fromWarehouseId,
        toWarehouseId: b.toWarehouseId,
        quantity: Number(b.quantity),
        status: "REQUESTED",
        requestedBy: user.id,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        // The mock's ctx.user carried only {id, role, vendorId}, so its `name`
        // was always undefined and `by` always fell back to 'You'.
        history: [{ status: "REQUESTED", at: nowISO(), by: user.name || "You" }],
    };
    await table("transfers").insert(transfer);
    return res.json({ success: true, data: transfer });
});

export const transitionStockTransfer = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const t = await table("transfers").find("id = ? AND vendorId = ?", [
        req.params.transferId,
        vendor.id,
    ]);
    if (!t) throw notFound("Transfer not found");
    const to = body(req).to;
    if (!canTransition(STOCK_TRANSITION_MAP, t.status, to))
        throw badRequest(`Invalid transition ${t.status} → ${to}`);
    if (to === "RECEIVED") {
        const from = await table("stock").find(
            "productId = ? AND warehouseId = ? AND vendorId = ?",
            [t.productId, t.fromWarehouseId, vendor.id]
        );
        const dest = await table("stock").find(
            "productId = ? AND warehouseId = ? AND vendorId = ?",
            [t.productId, t.toWarehouseId, vendor.id]
        );
        if (!from || !dest) throw badRequest("Stock records missing for transfer");
        if (from.available < t.quantity) throw badRequest("Insufficient stock at source warehouse");
        from.available -= t.quantity;
        dest.available += t.quantity;
        await table("stock").update(from.id, { available: from.available });
        await table("stock").update(dest.id, { available: dest.available });
    }
    t.status = to;
    t.updatedAt = nowISO();
    t.history.push({ status: to, at: nowISO(), by: user.name || "You" });
    await table("transfers").update(t.id, {
        status: t.status,
        updatedAt: t.updatedAt,
        history: t.history,
    });
    await addAudit(
        req,
        "updated",
        "stock transfer",
        t.id,
        `Transfer ${t.reference} → ${to}`,
        vendor.id
    );
    return res.json({ success: true, data: t });
});

/** Copied verbatim from server.js line 1083 (inside this range). */
const STOCK_TRANSITION_MAP = {
    REQUESTED: ["APPROVED", "REJECTED"],
    APPROVED: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["RECEIVED"],
    RECEIVED: [],
    REJECTED: [],
};
