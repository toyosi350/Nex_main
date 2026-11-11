import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { addAudit, body, requireVendor, vendorList } from "../middleware/context.js";
import { nowISO } from "../utils/http.js";
import { enrichCustomer } from "../services/enrich.js";
import { badRequest, notFound } from "../errors/api.errors.js";

/**
 * CUSTOMERS routes — port of server.js 644-712.
 *
 * Reads go through `vendorList` and every payload is enriched with
 * `enrichCustomer` exactly as the mock was.
 */
export const listCustomers = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "customers", {
        searchKeys: ["firstName", "lastName", "company", "email", "phone"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: { ...result, items: await Promise.all(result.items.map(enrichCustomer)) },
    });
});

export const getCustomer = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const c = await table("customers").find("id = ? AND vendorId = ?", [
        String(req.params.customerId),
        String(req.params.vendorId),
    ]);
    if (!c) throw notFound("Customer not found");
    return res.json({ success: true, data: await enrichCustomer(c) });
});

export const createCustomer = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.firstName || !b.lastName || !b.email) {
        throw badRequest("First name, last name and email are required");
    }
    const id = `cst-${vendor.id}-${String((await table("customers").count("vendorId = ?", [vendor.id])) + 1).padStart(3, "0")}-${Math.random().toString(36).slice(2, 5)}`;
    const customer = {
        id,
        vendorId: vendor.id,
        firstName: b.firstName,
        lastName: b.lastName,
        company: b.company || null,
        email: b.email,
        phone: b.phone || "",
        address: b.address || "",
        creditLimit: Number(b.creditLimit) || 0,
        paymentTerms: b.paymentTerms || "NET30",
        status: b.status || "ACTIVE",
        createdAt: nowISO(),
        totalPurchases: 0,
        totalPaid: 0,
        outstanding: 0,
        notes: b.notes ? [{ text: b.notes, by: "You", at: nowISO() }] : [],
        activity: [{ id: `act-${Date.now()}`, type: "CUSTOMER_CREATED", title: "Customer created", at: nowISO(), by: "You" }],
    };
    const created = await table("customers").insert(customer);
    await addAudit(req, "created", "customer", id, `Created customer ${created.firstName} ${created.lastName}`, vendor.id);
    return res.json({ success: true, data: await enrichCustomer(created) });
});

export const updateCustomer = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const c = await table("customers").find("id = ? AND vendorId = ?", [
        String(req.params.customerId),
        vendor.id,
    ]);
    if (!c) throw notFound("Customer not found");
    const b = body(req);
    const allowed = ["firstName", "lastName", "company", "email", "phone", "address", "creditLimit", "paymentTerms", "status"];
    const patch = {};
    allowed.forEach((k) => {
        if (b?.[k] !== undefined) patch[k] = b[k];
    });
    const activity = Array.isArray(c.activity) ? c.activity : [];
    patch.activity = [
        { id: `act-${Date.now()}`, type: "CUSTOMER_UPDATED", title: "Customer updated", at: nowISO(), by: "You" },
        ...activity,
    ];
    const updated = await table("customers").update(c.id, patch);
    await addAudit(req, "updated", "customer", updated.id, `Updated customer ${updated.company || updated.firstName + " " + updated.lastName}`, vendor.id);
    return res.json({ success: true, data: await enrichCustomer(updated) });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const c = await table("customers").find("id = ? AND vendorId = ?", [
        String(req.params.customerId),
        vendor.id,
    ]);
    if (!c) throw notFound("Customer not found");
    await table("customers").delete(c.id);
    await addAudit(req, "deleted", "customer", c.id, `Deleted customer ${c.company || c.firstName + " " + c.lastName}`, vendor.id);
    return res.json({ success: true, data: { message: "Customer deleted" } });
});
