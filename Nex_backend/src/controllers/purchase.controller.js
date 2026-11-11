import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { badRequest, notFound } from "../errors/api.errors.js";
import { futureIn, nowISO } from "../utils/http.js";
import { round2 } from "../utils/money.js";
import { canTransition } from "../utils/workflow.js";
import { addAudit, body, requireVendor, vendorList } from "../middleware/context.js";

export const listPurchaseRequests = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "purchase_requests", {
        searchKeys: ["number", "supplierName"],
        sortDefault: "createdAt",
    });
    return res.json({ success: true, data: result });
});

export const createPurchaseRequest = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.lines?.length) throw badRequest("At least one line item is required");
    const pr = {
        id: `pr-${Date.now()}`,
        number: `PR-${String(100000 + (await table("purchase_requests").count()) + 1)}`,
        vendorId: vendor.id,
        supplierId: b.supplierId || null,
        supplierName:
            b.supplierId && (await table("suppliers").get(b.supplierId))?.name,
        lines: b.lines.map((l) => ({
            id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            ...l,
        })),
        requestedBy: user.id,
        department: b.department || "Operations",
        status: "PENDING_APPROVAL",
        createdAt: nowISO(),
        activity: [],
    };
    return res.json({ success: true, data: await table("purchase_requests").insert(pr) });
});

export const transitionPurchaseRequest = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const pr = await table("purchase_requests").find("id = ? AND vendorId = ?", [
        req.params.id,
        vendor.id,
    ]);
    if (!pr) throw notFound("Purchase request not found");
    const status = body(req).to || pr.status;
    return res.json({
        success: true,
        data: await table("purchase_requests").update(pr.id, { status }),
    });
});

export const listPurchaseOrders = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "purchase_orders", {
        searchKeys: ["number", "supplierName"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: {
            ...result,
            items: result.items.map((po) => ({
                ...po,
                total: round2((po.lines || []).reduce((s, l) => s + l.quantity * l.unitCost, 0)),
            })),
        },
    });
});

export const getPurchaseOrder = asyncHandler(async (req, res) => {
    await requireVendor(req, req.params.vendorId);
    const po = await table("purchase_orders").find("id = ? AND vendorId = ?", [
        req.params.poId,
        req.params.vendorId,
    ]);
    if (!po) throw notFound("Purchase order not found");
    return res.json({ success: true, data: po });
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.supplierId || !b.lines?.length)
        throw badRequest("Supplier and line items are required");
    const po = {
        id: `po-${Date.now()}`,
        number: `PO-${String(100000 + (await table("purchase_orders").count()) + 1)}`,
        vendorId: vendor.id,
        supplierId: b.supplierId,
        supplierName: (await table("suppliers").get(b.supplierId))?.name,
        purchaseRequestId: b.purchaseRequestId || null,
        lines: b.lines.map((l) => ({
            id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            receivedQty: 0,
            ...l,
        })),
        status: "DRAFT",
        expectedDelivery: b.expectedDelivery || futureIn(20, 5),
        createdAt: nowISO(),
        approvedBy: null,
        receivedAt: null,
        activity: [],
    };
    return res.json({ success: true, data: await table("purchase_orders").insert(po) });
});

export const transitionPurchaseOrder = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const po = await table("purchase_orders").find("id = ? AND vendorId = ?", [
        req.params.poId,
        vendor.id,
    ]);
    if (!po) throw notFound("Purchase order not found");
    const b = body(req);
    const to = b.to;
    if (!canTransition(PO_MAP, po.status, to))
        throw badRequest(`Invalid PO transition ${po.status} → ${to}`);
    const patch = {
        status: to,
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "PO_STATUS",
                title: `PO status → ${to}`,
                at: nowISO(),
                by: (await table("users").get(user.id))?.name || "You",
            },
            ...(po.activity || []),
        ],
    };
    if (to === "APPROVED") patch.approvedBy = user.id;
    const updated = await table("purchase_orders").update(po.id, patch);
    await addAudit(
        req,
        "approved",
        "purchase order",
        po.id,
        `Purchase order ${po.number} → ${to}`,
        vendor.id
    );
    return res.json({ success: true, data: updated });
});

const PO_MAP = {
    DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
    PENDING_APPROVAL: ["APPROVED", "CANCELLED"],
    APPROVED: ["SENT", "CANCELLED"],
    SENT: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
    PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
    RECEIVED: [],
    CANCELLED: [],
};

export const receivePurchaseOrder = asyncHandler(async (req, res) => {
    const { user, vendor } = await requireVendor(req, req.params.vendorId);
    const po = await table("purchase_orders").find("id = ? AND vendorId = ?", [
        req.params.poId,
        vendor.id,
    ]);
    if (!po) throw notFound("Purchase order not found");
    const b = body(req);
    const poLines = po.lines || [];
    const receivedLines = (b.lines || poLines).map((l) => ({
        ...l,
        receivedQty: Number(l.receivedQty),
    }));
    receivedLines.forEach((l) => {
        const poLine = poLines.find((x) => x.id === l.id);
        if (poLine) poLine.receivedQty = Number(l.receivedQty) || poLine.receivedQty;
    });
    const allReceived = poLines.every((l) => l.receivedQty >= l.quantity);
    const status = allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";
    const updated = await table("purchase_orders").update(po.id, {
        lines: poLines,
        status,
        receivedAt: nowISO(),
    });
    await table("receipts").insert({
        id: `gr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        number: `GRN-${String(100000 + (await table("receipts").count()) + 1)}`,
        vendorId: vendor.id,
        purchaseOrderId: po.id,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        lines: receivedLines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: l.receivedQty,
            unitCost: l.unitCost,
        })),
        status: "POSTED",
        receivedAt: nowISO(),
    });
    /* add received qty from primary warehouse that has this product */
    for (const l of receivedLines) {
        if (!Number(l.receivedQty)) continue;
        const row = (
            await table("stock").all("productId = ? AND vendorId = ?", [l.productId, vendor.id])
        ).find((s) => s.warehouseId.endsWith("1"));
        if (row) {
            const movements = [
                {
                    id: `mvt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                    type: "IN",
                    qty: Number(l.receivedQty),
                    reason: "GOODS RECEIVED",
                    at: nowISO(),
                    userId: user.id,
                },
                ...(row.movements || []),
            ];
            await table("stock").update(row.id, {
                available: row.available + Number(l.receivedQty),
                incoming: Math.max(0, row.incoming - Number(l.receivedQty)),
                movements,
            });
        }
    }
    await addAudit(
        req,
        "received goods for",
        "purchase order",
        po.id,
        `Goods received against ${po.number}`,
        vendor.id
    );
    return res.json({ success: true, data: updated });
});

export const listGoodsReceipts = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "receipts", {
        searchKeys: ["number", "supplierName"],
        sortDefault: "receivedAt",
    });
    return res.json({ success: true, data: result });
});
