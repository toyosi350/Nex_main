import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { body, query, requireVendor, vendorList } from "../middleware/context.js";
import { futureIn, nowISO } from "../utils/http.js";
import { badRequest, notFound } from "../errors/api.errors.js";

/**
 * Projects + tasks — mock server.js 2068–2180.
 *
 * The projects list keeps the paginated `vendorList` envelope with each item
 * enriched with `teamMembers` names; the tasks list is a bespoke
 * `{ items, total }` built in JS after projectId/status query filtering.
 */

/* --- projects --------------------------------------------------------- */

export const listProjects = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "projects", {
        searchKeys: ["name", "department"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: {
            ...result,
            items: await Promise.all(
                result.items.map(async (p) => ({
                    ...p,
                    teamMembers: (await Promise.all(
                        (p.teamIds || []).map((id) => table("employees").get(id))
                    ))
                        .map((e) => e?.name)
                        .filter(Boolean),
                }))
            ),
        },
    });
});

export const getProject = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const p = await table("projects").find("id = ? AND vendorId = ?", [
        req.params.projectId,
        String(req.params.vendorId),
    ]);
    if (!p) throw notFound("Project not found");
    return res.json({
        success: true,
        data: {
            ...p,
            tasks: (await table("tasks").all("projectId = ?", [p.id])).sort((a, b) => a.order - b.order),
            team: await Promise.all((p.teamIds || []).map((id) => table("employees").get(id))),
        },
    });
});

export const createProject = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.name) throw badRequest("Project name is required");
    const prj = {
        id: `prj-${Date.now()}`,
        vendorId: vendor.id,
        name: b.name,
        description: b.description || "",
        department: b.department || "Operations",
        status: b.status || "PLANNING",
        budget: Number(b.budget) || 0,
        spent: 0,
        progress: 0,
        startDate: b.startDate || nowISO(),
        deadline: b.deadline || futureIn(90, 30),
        teamIds: b.teamIds || [],
        milestones: [],
        createdAt: nowISO(),
        activity: [],
    };
    return res.json({ success: true, data: await table("projects").insert(prj) });
});

export const updateProject = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const p = await table("projects").find("id = ? AND vendorId = ?", [
        req.params.projectId,
        String(req.params.vendorId),
    ]);
    if (!p) throw notFound("Project not found");
    const b = body(req);
    const patch = {};
    for (const k of [
        "name",
        "description",
        "department",
        "status",
        "budget",
        "spent",
        "progress",
        "deadline",
        "teamIds",
    ]) {
        if (b[k] !== undefined) patch[k] = b[k];
    }
    return res.json({ success: true, data: await table("projects").update(p.id, patch) });
});

/* --- tasks ------------------------------------------------------------ */

export const listTasks = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const q = query(req);
    let tasks = await table("tasks").all("vendorId = ?", [vendor.id]);
    if (q.projectId) tasks = tasks.filter((t) => t.projectId === q.projectId);
    if (q.status) tasks = tasks.filter((t) => t.status === q.status);
    return res.json({
        success: true,
        data: {
            items: await Promise.all(
                tasks.map(async (t) => ({
                    ...t,
                    projectName: (await table("projects").get(t.projectId))?.name,
                    assigneeName: (await table("employees").get(t.assigneeId))?.name,
                }))
            ),
            total: tasks.length,
        },
    });
});

export const createTask = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.title || !b.projectId) throw badRequest("Task title and project are required");
    const task = {
        id: `tsk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        vendorId: vendor.id,
        projectId: b.projectId,
        title: b.title,
        description: b.description || "",
        status: b.status || "TODO",
        priority: b.priority || "MEDIUM",
        assigneeId: b.assigneeId || null,
        dueDate: b.dueDate || futureIn(30, 1),
        order: await table("tasks").count("projectId = ?", [b.projectId]),
        createdAt: nowISO(),
        activity: [],
    };
    return res.json({ success: true, data: await table("tasks").insert(task) });
});

export const updateTask = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const t = await table("tasks").find("id = ? AND vendorId = ?", [
        req.params.taskId,
        String(req.params.vendorId),
    ]);
    if (!t) throw notFound("Task not found");
    const b = body(req);
    const patch = {};
    for (const k of ["status", "priority", "assigneeId", "dueDate", "title", "description", "order"]) {
        if (b[k] !== undefined) patch[k] = b[k];
    }
    return res.json({ success: true, data: await table("tasks").update(t.id, patch) });
});
