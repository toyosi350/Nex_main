import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { body, requireVendor, vendorList } from "../middleware/context.js";
import { nowISO } from "../utils/http.js";
import { canTransition } from "../utils/workflow.js";
import { badRequest, notFound } from "../errors/api.errors.js";

/* ================= TICKETS ================= */

/**
 * The mock's tokens carried no name claim (`ctx.user` was
 * `{ id, role, vendorId }`), so `ctx.user.name || 'You'` always resolved to
 * the placeholder; we look the actor up in `users` the same way `addAudit`
 * does so the activity feed shows who acted.
 */
async function actorName(userId) {
    return (await table("users").get(userId))?.name || "You";
}

export const listTickets = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "tickets", {
        searchKeys: ["number", "subject", "customerName"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: {
            ...result,
            items: await Promise.all(
                result.items.map(async (t) => ({
                    ...t,
                    assignedName: (await table("users").get(t.assignedTo))?.name || "Unassigned",
                }))
            ),
        },
    });
});

export const getTicket = asyncHandler(async (req, res) => {
    await requireVendor(req, req.params.vendorId);
    const t = await table("tickets").find("id = ? AND vendorId = ?", [
        req.params.ticketId,
        req.params.vendorId,
    ]);
    if (!t) throw notFound("Ticket not found");
    return res.json({
        success: true,
        data: {
            ...t,
            customer: await table("customers").get(t.customerId),
            assignedName: (await table("users").get(t.assignedTo))?.name,
        },
    });
});

export const createTicket = asyncHandler(async (req, res) => {
    const { vendor, user } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.subject || !b.customerId) throw badRequest("Subject and customer are required");
    const tk = {
        id: `tk-${Date.now()}`,
        number: `TK-${1000 + (await table("tickets").count()) * 3 + 4}`,
        vendorId: vendor.id,
        subject: b.subject,
        customerId: b.customerId,
        customerName: b.customerName || "",
        priority: b.priority || "MEDIUM",
        status: "OPEN",
        source: b.source || "WEB",
        assignedTo: b.assignedTo || null,
        createdBy: user.id,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        comments: [],
        activity: [
            {
                id: `act-${Date.now()}`,
                type: "TICKET_CREATED",
                title: "Ticket created",
                at: nowISO(),
                by: await actorName(user.id),
            },
        ],
    };
    const customer = await table("customers").get(b.customerId);
    tk.customerName = customer?.company || `${customer?.firstName} ${customer?.lastName}`;
    return res.json({ success: true, data: await table("tickets").insert(tk) });
});

export const updateTicket = asyncHandler(async (req, res) => {
    await requireVendor(req, req.params.vendorId);
    const t = await table("tickets").find("id = ? AND vendorId = ?", [
        req.params.ticketId,
        req.params.vendorId,
    ]);
    if (!t) throw notFound("Ticket not found");
    const b = body(req);
    const patch = {};
    ["priority", "status", "assignedTo"].forEach((k) => {
        if (b[k] !== undefined) patch[k] = b[k];
    });
    patch.updatedAt = nowISO();
    return res.json({ success: true, data: await table("tickets").update(t.id, patch) });
});

export const transitionTicket = asyncHandler(async (req, res) => {
    const { vendor, user } = await requireVendor(req, req.params.vendorId);
    const t = await table("tickets").find("id = ? AND vendorId = ?", [req.params.ticketId, vendor.id]);
    if (!t) throw notFound("Ticket not found");
    const to = body(req).to;
    if (!canTransition(TICKET_MAP, t.status, to)) {
        throw badRequest(`Invalid ticket transition ${t.status} → ${to}`);
    }
    const activity = Array.isArray(t.activity) ? t.activity : [];
    activity.unshift({
        id: `act-${Date.now()}`,
        type: "TICKET_STATUS",
        title: `Ticket status → ${to}`,
        at: nowISO(),
        by: await actorName(user.id),
    });
    return res.json({
        success: true,
        data: await table("tickets").update(t.id, { status: to, updatedAt: nowISO(), activity }),
    });
});

/* local map, copied verbatim from the mock (server.js line 2317) */
const TICKET_MAP = {
    OPEN: ["IN_PROGRESS", "WAITING", "CLOSED"],
    IN_PROGRESS: ["WAITING", "RESOLVED", "CLOSED"],
    WAITING: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
    RESOLVED: ["CLOSED"],
    CLOSED: [],
};

export const addComment = asyncHandler(async (req, res) => {
    const { vendor, user } = await requireVendor(req, req.params.vendorId);
    const t = await table("tickets").find("id = ? AND vendorId = ?", [req.params.ticketId, vendor.id]);
    if (!t) throw notFound("Ticket not found");
    const b = body(req);
    if (!b.text) throw badRequest("Comment text is required");
    const comments = Array.isArray(t.comments) ? t.comments : [];
    comments.push({
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        text: b.text,
        by: await actorName(user.id),
        at: nowISO(),
    });
    const activity = Array.isArray(t.activity) ? t.activity : [];
    activity.unshift({
        id: `act-${Date.now()}`,
        type: "COMMENT_ADDED",
        title: "Comment added",
        at: nowISO(),
        by: await actorName(user.id),
    });
    return res.json({
        success: true,
        data: await table("tickets").update(t.id, { comments, activity, updatedAt: nowISO() }),
    });
});
