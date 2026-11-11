import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { query, requireUser } from "../middleware/context.js";
import { nowISO, paginate, sortItems } from "../utils/http.js";

/* ================= NOTIFICATIONS ================= */

export const listNotifications = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const list = (await table("notifications").all()).filter(
        (n) => !n.vendorId || n.vendorId === user.vendorId
    );
    const unread = list.filter((n) => !n.read).length;
    return res.json({
        success: true,
        data: {
            items: list
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 50),
            unread,
        },
    });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const n = await table("notifications").get(req.params.id);
    /* Only notifications visible to this caller's workspace. */
    if (n && (!n.vendorId || n.vendorId === user.vendorId)) {
        await table("notifications").update(n.id, { read: true });
    }
    return res.json({ success: true, data: { ok: true } });
});

export const markAllRead = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const rows = (await table("notifications").all()).filter(
        (n) => !n.vendorId || n.vendorId === user.vendorId
    );
    for (const n of rows) {
        await table("notifications").update(n.id, { read: true });
    }
    return res.json({ success: true, data: { ok: true } });
});

/* ================= AUDIT ================= */

export const listAuditLogs = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    let logs = await table("audit_logs").all();
    if (user.role !== "SUPER_ADMIN" && user.role !== "PLATFORM_SUPPORT") {
        logs = logs.filter((l) => l.vendorId === user.vendorId);
    }
    const q = query(req);
    if (q.search) {
        const t = String(q.search).toLowerCase();
        logs = logs.filter((l) =>
            (l.detail || l.userName || l.action || "").toLowerCase().includes(t)
        );
    }
    if (q.entity) logs = logs.filter((l) => l.entity === q.entity);
    const sorted = sortItems(logs, q, "at");
    return res.json({ success: true, data: paginate(sorted, q) });
});

/* ================= SEARCH ================= */

export const search = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const q = String(query(req).q || "").trim().toLowerCase();
    if (!q) return res.json({ success: true, data: { query: "", results: {} } });
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "PLATFORM_SUPPORT";
    const byVendor = (vendorId) => (isAdmin ? true : vendorId === user.vendorId);
    const textMatch = (candidate) => String(candidate || "").toLowerCase().includes(q);

    const results = {
        customers: (await table("customers").all())
            .filter(
                (c) =>
                    byVendor(c.vendorId) &&
                    (textMatch(c.firstName) || textMatch(c.lastName) || textMatch(c.company) || textMatch(c.email))
            )
            .slice(0, 5),
        providers: (await table("suppliers").all())
            .filter((s) => byVendor(s.vendorId) && (textMatch(s.name) || textMatch(s.contactPerson)))
            .slice(0, 5),
        employees: (await table("employees").all())
            .filter((e) => byVendor(e.vendorId) && (textMatch(e.name) || textMatch(e.email) || textMatch(e.position)))
            .slice(0, 5),
        products: (await table("products").all())
            .filter((p) => byVendor(p.vendorId) && (textMatch(p.name) || textMatch(p.sku) || textMatch(p.brand)))
            .slice(0, 5),
        orders: (await table("orders").all())
            .filter((o) => byVendor(o.vendorId) && textMatch(o.number))
            .slice(0, 5),
        invoices: (await table("invoices").all())
            .filter((i) => byVendor(i.vendorId) && (textMatch(i.number) || textMatch(i.customerName)))
            .slice(0, 5),
        projects: (await table("projects").all())
            .filter((pr) => byVendor(pr.vendorId) && textMatch(pr.name))
            .slice(0, 5),
        tickets: (await table("tickets").all())
            .filter((t) => byVendor(t.vendorId) && (textMatch(t.number) || textMatch(t.subject)))
            .slice(0, 5),
    };
    await table("searches").insert({ id: `sch-${Date.now()}`, term: q, at: nowISO() });
    return res.json({ success: true, data: { query: query(req).q, results } });
});
