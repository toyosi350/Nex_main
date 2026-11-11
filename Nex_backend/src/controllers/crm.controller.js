import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { body, requireVendor, vendorList } from "../middleware/context.js";
import { nowISO } from "../utils/http.js";
import { badRequest, notFound } from "../errors/api.errors.js";

/**
 * CRM leads — mock server.js 2181–2244.
 *
 * `/leads` returns the paginated vendorList envelope with `assignedName`
 * resolved per row; `/leads/pipeline` returns the bare stage columns.
 */
export const listLeads = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "leads", { searchKeys: ["name", "company"], sortDefault: "createdAt" });
    return res.json({
        success: true,
        data: {
            ...result,
            items: await Promise.all(
                result.items.map(async (l) => ({
                    ...l,
                    assignedName: (await table("users").get(l.assignedUser))?.name || "Unassigned",
                }))
            ),
        },
    });
});

export const leadPipeline = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const leads = await table("leads").all("vendorId = ?", [vendor.id]);
    const stageOrder = ["LEADS", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
    return res.json({
        success: true,
        data: await Promise.all(
            stageOrder.map(async (stage) => ({
                stage,
                leads: await Promise.all(
                    leads
                        .filter((l) => l.stage === stage)
                        .map(async (l) => ({
                            ...l,
                            assignedName: (await table("users").get(l.assignedUser))?.name || "Unassigned",
                        }))
                ),
            }))
        ),
    });
});

export const createLead = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.name) throw badRequest("Lead name is required");
    const lead = {
        id: `lead-${Date.now()}`,
        vendorId: vendor.id,
        name: b.name,
        company: b.company || null,
        email: b.email || "",
        phone: b.phone || "",
        stage: b.stage || "LEADS",
        value: Number(b.value) || 0,
        assignedUser: b.assignedUser || null,
        source: b.source || "WEBSITE",
        nextAction: b.nextAction || "",
        lastActivity: nowISO(),
        createdAt: nowISO(),
        activity: [],
    };
    return res.json({ success: true, data: await table("leads").insert(lead) });
});

export const updateLead = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const lead = await table("leads").find("id = ? AND vendorId = ?", [
        req.params.leadId,
        String(req.params.vendorId),
    ]);
    if (!lead) throw notFound("Lead not found");
    const b = body(req);
    const patch = {};
    for (const k of [
        "name",
        "company",
        "email",
        "phone",
        "stage",
        "value",
        "assignedUser",
        "source",
        "nextAction",
    ]) {
        if (b[k] !== undefined) patch[k] = b[k];
    }
    patch.lastActivity = nowISO();
    return res.json({ success: true, data: await table("leads").update(lead.id, patch) });
});
