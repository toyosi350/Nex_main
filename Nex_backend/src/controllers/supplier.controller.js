import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { addAudit, body, requireVendor, vendorList } from "../middleware/context.js";
import { round2 } from "../utils/money.js";
import { enrichProduct, enrichSupplier } from "../services/enrich.js";
import { badRequest, notFound } from "../errors/api.errors.js";

/**
 * SUPPLIERS routes — port of server.js 713-769.
 */
export const listSuppliers = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "suppliers", {
        searchKeys: ["name", "contactPerson", "email", "phone"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: { ...result, items: await Promise.all(result.items.map(enrichSupplier)) },
    });
});

export const getSupplier = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const s = await table("suppliers").find("id = ? AND vendorId = ?", [
        String(req.params.supplierId),
        String(req.params.vendorId),
    ]);
    if (!s) throw notFound("Supplier not found");
    const pos = await table("purchase_orders").all("supplierId = ?", [s.id]);
    const lineSum = (p) => (p.lines || []).reduce((x, l) => x + l.quantity * l.unitCost, 0);
    return res.json({
        success: true,
        data: {
            ...(await enrichSupplier(s)),
            purchaseOrders: pos
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((p) => ({
                    id: p.id,
                    number: p.number,
                    status: p.status,
                    total: round2(lineSum(p)),
                    createdAt: p.createdAt,
                })),
            products: await Promise.all(
                (await table("products").all())
                    .filter((p) => (s.products || []).includes(p.id))
                    .map(enrichProduct)
            ),
        },
    });
});

export const createSupplier = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.name || !b.contactPerson) {
        throw badRequest("Company name and contact person are required");
    }
    const id = `sup-${vendor.id}-${(await table("suppliers").count("vendorId = ?", [vendor.id])) + 1}`;
    const supplier = {
        id,
        vendorId: vendor.id,
        name: b.name,
        contactPerson: b.contactPerson,
        email: b.email || "",
        phone: b.phone || "",
        address: b.address || "",
        paymentTerms: b.paymentTerms || "NET30",
        paymentMethod: b.paymentMethod || "BANK_TRANSFER",
        status: b.status || "ACTIVE",
        products: [],
    };
    const created = await table("suppliers").insert(supplier);
    await addAudit(req, "created", "supplier", id, `Created supplier ${created.name}`, vendor.id);
    return res.json({ success: true, data: created });
});

export const updateSupplier = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const s = await table("suppliers").find("id = ? AND vendorId = ?", [
        String(req.params.supplierId),
        vendor.id,
    ]);
    if (!s) throw notFound("Supplier not found");
    const b = body(req);
    const patch = {};
    ["name", "contactPerson", "email", "phone", "address", "paymentTerms", "paymentMethod", "status"].forEach((k) => {
        if (b?.[k] !== undefined) patch[k] = b[k];
    });
    const updated = Object.keys(patch).length ? await table("suppliers").update(s.id, patch) : s;
    return res.json({ success: true, data: updated });
});
