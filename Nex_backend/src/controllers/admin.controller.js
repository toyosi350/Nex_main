import asyncHandler from "../middleware/async.middleware.js";
import table from "../repositories/table.js";
import { addAudit, body, futureDays, newId, query, requireUser, sanitizeUser } from "../middleware/context.js";
import { badRequest, conflict, forbidden, notFound } from "../errors/api.errors.js";
import {
    filterBySearch,
    inMonth,
    monthSeries,
    monthShort,
    nowISO,
    paginate,
    shortName,
    sortItems,
} from "../utils/http.js";
import { round2 } from "../utils/money.js";
import { hashPassword } from "../utils/password.js";

/*
|--------------------------------------------------------------------
| PLATFORM / ADMIN routes — port of server.js 347-588.
|
| Every user object that leaves these handlers goes through `sanitizeUser`
| (the mock had no `passwordHash` on its in-memory rows; ours do).
|--------------------------------------------------------------------
*/

export const dashboard = asyncHandler(async (req, res) => {
    requireUser(req);
    const activeVendors = await table("vendors").all("status = 'ACTIVE'");
    const totalCustomers = await table("customers").count();
    const totalEmployees = await table("employees").count();
    const totalProducts = await table("products").count();
    const totalOrders = await table("orders").count();
    const totalInvoices = await table("invoices").count();
    const invoices = await table("invoices").all();
    const totalRevenue = invoices.filter((i) => i.status !== "CANCELLED").reduce((s, i) => s + i.amountPaid, 0);
    const activeUsers = await table("users").count("status = 'ACTIVE'");
    const orders = await table("orders").all();
    const tickets = await table("tickets").all();

    const monthlyActivity = monthSeries(12, (d) => {
        const monthInvoices = invoices.filter((i) => inMonth(new Date(i.createdAt), d));
        const monthOrders = orders.filter((o) => inMonth(new Date(o.createdAt), d));
        const monthTickets = tickets.filter((t) => inMonth(new Date(t.createdAt), d));
        return {
            label: monthShort(d),
            revenue: round2(monthInvoices.reduce((s, i) => s + i.amountPaid, 0)),
            orders: monthOrders.length,
            tickets: monthTickets.length,
            invoices: monthInvoices.length,
        };
    });

    const vendorGrowth = [...activeVendors]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-12)
        .map((v) => ({ label: shortName(v.company), createdAt: v.createdAt.slice(0, 10) }))
        .reduce((acc, v) => {
            const key = v.createdAt.slice(0, 7);
            const existing = acc.find((a) => a.month === key);
            if (existing) existing.count += 1;
            else acc.push({ month: key, label: key, count: 1 });
            return acc;
        }, []);

    /* `table()` is async, so the customers each month filters are loaded once
       here — the reference called `table('customers').all()` inside the sync
       monthSeries callback, which cannot be awaited. Same snapshot, same output. */
    const customers = await table("customers").all();

    return res.json({
        success: true,
        data: {
            metrics: {
                totalVendors: await table("vendors").count(),
                activeVendors: activeVendors.length,
                pendingVendors: await table("vendors").count("status = 'PENDING'"),
                totalCustomers,
                totalEmployees,
                totalProducts,
                totalTransactions: totalInvoices + totalOrders + (await table("expenses").count()),
                platformRevenue: round2(totalRevenue),
                activeUsers,
                totalTickets: tickets.length,
                openTickets: tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length,
            },
            revenueByVendor: (await table("vendors").all()).map((v) => ({
                name: shortName(v.company),
                revenue: round2(
                    invoices
                        .filter((i) => i.vendorId === v.id && i.status !== "CANCELLED")
                        .reduce((s, i) => s + i.amountPaid, 0)
                ),
            })),
            monthlyActivity,
            vendorGrowth,
            customerGrowth: monthSeries(9, (d) => ({
                label: monthShort(d),
                customers: customers.filter((c) => inMonth(new Date(c.createdAt), d)).length,
            })),
            recentVendors: (await table("vendors").all())
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5),
            lowStockCount: await table("stock").count("available <= reorderLevel"),
        },
    });
});

export const listVendors = asyncHandler(async (req, res) => {
    requireUser(req);
    const q = query(req);
    let vendors = await table("vendors").all();
    vendors = sortItems(vendors, q, "createdAt");
    if (q.search) {
        vendors = filterBySearch(vendors, ["company", "email", "industry", "city"], q.search);
    }
    if (q.status && q.status !== "ALL") {
        vendors = vendors.filter((v) => v.status === q.status);
    }
    const result = paginate(vendors, q);
    const items = await Promise.all(
        result.items.map(async (v) => ({
            ...v,
            userCount: await table("users").count("vendorId = ?", [v.id]),
            productCount: await table("products").count("vendorId = ?", [v.id]),
        }))
    );

    return res.json({
        success: true,
        data: { ...result, items },
    });
});

export const getVendor = asyncHandler(async (req, res) => {
    requireUser(req);
    const vendor = await table("vendors").get(String(req.params.vendorId));
    if (!vendor) throw notFound("Vendor not found");
    const invoices = await table("invoices").all("vendorId = ?", [vendor.id]);

    return res.json({
        success: true,
        data: {
            ...vendor,
            userCount: await table("users").count("vendorId = ?", [vendor.id]),
            productCount: await table("products").count("vendorId = ?", [vendor.id]),
            customerCount: await table("customers").count("vendorId = ?", [vendor.id]),
            invoiceTotal: round2(invoices.reduce((s, i) => s + i.total, 0)),
            amountCollected: round2(invoices.reduce((s, i) => s + i.amountPaid, 0)),
            employeeCount: await table("employees").count("vendorId = ?", [vendor.id]),
        },
    });
});

export const createVendor = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    if (user.role !== "SUPER_ADMIN") throw forbidden("Only platform admins can create vendors");
    const b = body(req);
    if (!b.company || !b.email) throw badRequest("Company name and email are required");
    if (await table("vendors").find("LOWER(email) = ?", [String(b.email).toLowerCase()])) {
        throw conflict("A vendor with this email already exists");
    }
    const vendor = {
        id: `v-${String((await table("vendors").count()) + 1).padStart(2, "0")}`,
        company: b.company,
        registrationNumber: b.registrationNumber || `RC-${Date.now().toString().slice(-6)}`,
        email: b.email,
        phone: b.phone || "+234 800 000 0000",
        address: b.address || "\u2014",
        city: b.city || "Lagos",
        industry: b.industry || "General",
        taxId: b.taxId || "",
        status: "ACTIVE",
        plan: b.plan || "BASIC",
        logo: null,
        createdAt: nowISO(),
        subscription: {
            startedAt: nowISO(),
            renewal: futureDays(60),
            monthlyFee: b.plan === "ENTERPRISE" ? 850000 : b.plan === "PROFESSIONAL" ? 450000 : 150000,
        },
        creditLimit: Number(b.creditLimit) || 0,
    };
    const created = await table("vendors").insert(vendor);
    await addAudit(req, "created", "vendor", created.id, `Created vendor ${created.company}`, created.id);

    return res.json({
        success: true,
        data: created,
    });
});

export const updateVendor = asyncHandler(async (req, res) => {
    requireUser(req);
    const vendor = await table("vendors").get(String(req.params.vendorId));
    if (!vendor) throw notFound("Vendor not found");
    const b = body(req);
    const allowed = ["company", "registrationNumber", "email", "phone", "address", "city", "industry", "taxId", "plan", "creditLimit"];
    const patch = {};
    allowed.forEach((k) => {
        if (b?.[k] !== undefined) patch[k] = b[k];
    });
    const updated = Object.keys(patch).length ? await table("vendors").update(vendor.id, patch) : vendor;
    await addAudit(req, "updated", "vendor", updated.id, `Updated vendor ${updated.company}`, updated.id);

    return res.json({
        success: true,
        data: updated,
    });
});

export const vendorStatus = asyncHandler(async (req, res) => {
    requireUser(req);
    const vendor = await table("vendors").get(String(req.params.vendorId));
    if (!vendor) throw notFound("Vendor not found");
    const { status } = body(req);
    if (!["ACTIVE", "SUSPENDED", "INACTIVE", "PENDING"].includes(status)) {
        throw badRequest("Invalid vendor status");
    }
    const updated = await table("vendors").update(vendor.id, { status });
    await addAudit(req, "changed status of", "vendor", updated.id, `${updated.company} set to ${status}`, updated.id);

    return res.json({
        success: true,
        data: updated,
    });
});

export const deleteVendor = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    if (user.role !== "SUPER_ADMIN") throw forbidden("Only platform admins can delete vendors");
    const vendor = await table("vendors").get(String(req.params.vendorId));
    if (!vendor) throw notFound("Vendor not found");
    await table("vendors").delete(vendor.id);
    await addAudit(req, "deleted", "vendor", vendor.id, `Deleted vendor ${vendor.company}`, vendor.id);

    return res.json({
        success: true,
        data: { message: "Vendor deleted", id: vendor.id },
    });
});

export const listVendorUsers = asyncHandler(async (req, res) => {
    requireUser(req);
    const users = await table("users").all("vendorId = ?", [String(req.params.vendorId)]);
    const result = paginate(sortItems(users, query(req), "createdAt"), query(req));

    return res.json({
        success: true,
        data: { ...result, items: result.items.map(sanitizeUser) },
    });
});

export const addVendorUser = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    if (user.role !== "SUPER_ADMIN") throw forbidden("Only platform admins can add users");
    const b = body(req);
    if (!b.name || !b.email || !b.role) throw badRequest("Name, email and role are required");
    const vendorId = String(req.params.vendorId);
    const u = {
        id: `u-${vendorId}-${(await table("users").count()) + 1}-${Math.random().toString(36).slice(2, 6)}`,
        vendorId,
        name: b.name,
        email: b.email,
        role: b.role,
        status: b.status || "INVITED",
        phone: b.phone || "",
        lastLogin: null,
        // invited users have no password yet — an unguessable hash keeps the
        // NOT NULL column satisfied without enabling login
        passwordHash: await hashPassword(newId("invite")),
    };
    const created = await table("users").insert(u);

    return res.json({
        success: true,
        data: sanitizeUser(created),
    });
});

export const updateVendorUser = asyncHandler(async (req, res) => {
    requireUser(req);
    const u = await table("users").find("id = ? AND vendorId = ?", [
        String(req.params.userId),
        String(req.params.vendorId),
    ]);
    if (!u) throw notFound("User not found");
    const b = body(req);
    const patch = {};
    ["name", "role", "status", "phone"].forEach((k) => {
        if (b?.[k] !== undefined) patch[k] = b[k];
    });
    const updated = Object.keys(patch).length ? await table("users").update(u.id, patch) : u;

    return res.json({
        success: true,
        data: sanitizeUser(updated),
    });
});

export const listUsers = asyncHandler(async (req, res) => {
    requireUser(req);
    let users = await table("users").all();
    if (req.query.search) users = filterBySearch(users, ["name", "email", "role"], req.query.search);
    users = sortItems(users, query(req), "createdAt");
    const result = paginate(users, query(req));

    return res.json({
        success: true,
        data: { ...result, items: result.items.map(sanitizeUser) },
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    requireUser(req);
    const u = await table("users").get(String(req.params.userId));
    if (!u) throw notFound("User not found");
    const { status } = body(req);
    const updated = status ? await table("users").update(u.id, { status }) : u;

    return res.json({
        success: true,
        data: sanitizeUser(updated),
    });
});
