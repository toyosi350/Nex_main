import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { badRequest, notFound } from "../errors/api.errors.js";
import { nowISO, sortItems } from "../utils/http.js";
import { canTransition } from "../utils/workflow.js";
import { addAudit, body, query, requireUser, requireVendor, vendorList } from "../middleware/context.js";

/* --- departments ------------------------------------------------------ */

export const getDepartments = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const departments = await table("departments").all("vendorId = ?", [vendor.id]);
    const items = await Promise.all(
        departments.map(async (d) => ({
            ...d,
            employeeCount: await table("employees").count("departmentId = ?", [d.id]),
        }))
    );

    return res.json({ success: true, data: items });
});

export const createDepartment = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.name) throw badRequest("Department name is required");
    const d = {
        id: `dep-${vendor.id}-${(await table("departments").count("vendorId = ?", [vendor.id])) + 1}`,
        vendorId: vendor.id,
        name: b.name,
        code: b.code || `DEP${(await table("departments").count("vendorId = ?", [vendor.id])) + 1}`,
        headId: b.headId || null,
        description: b.description || "",
        employeeCount: 0,
    };
    const created = await table("departments").insert(d);

    return res.json({ success: true, data: created });
});

/* --- employees -------------------------------------------------------- */

export const listEmployees = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "employees", {
        searchKeys: ["name", "email", "employeeId", "position"],
        sortDefault: "employmentDate",
    });
    const items = await Promise.all(
        result.items.map(async (e) => ({
            ...e,
            departmentName: (await table("departments").get(e.departmentId))?.name,
            managerName: (await table("employees").get(e.managerId))?.name,
        }))
    );

    return res.json({
        success: true,
        data: {
            ...result,
            items,
        },
    });
});

export const getEmployee = asyncHandler(async (req, res) => {
    await requireVendor(req, String(req.params.vendorId));
    const e = await table("employees").find("id = ? AND vendorId = ?", [
        req.params.employeeId,
        String(req.params.vendorId),
    ]);
    if (!e) throw notFound("Employee not found");
    const attendance = (await table("attendance").all("employeeId = ?", [e.id])).slice(-30);
    const leave = await table("leave_requests").all("employeeId = ?", [e.id]);
    const departmentName = (await table("departments").get(e.departmentId))?.name;
    const projects = (await table("tasks").all("assigneeId = ?", [e.id])).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        projectId: t.projectId,
    }));

    return res.json({
        success: true,
        data: {
            ...e,
            departmentName,
            attendance,
            leave,
            projects,
        },
    });
});

export const createEmployee = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.name || !b.email || !b.departmentId) {
        throw badRequest("Name, email and department are required");
    }
    const emp = {
        id: `emp-${vendor.id}-${(await table("employees").count("vendorId = ?", [vendor.id])) + 1}-${Math.random()
            .toString(36)
            .slice(2, 5)}`,
        vendorId: vendor.id,
        employeeId:
            b.employeeId ||
            `EMP-${String((await table("employees").count("vendorId = ?", [vendor.id])) + 1).padStart(4, "0")}`,
        userId: null,
        name: b.name,
        email: b.email,
        phone: b.phone || "",
        departmentId: b.departmentId,
        position: b.position || "Staff",
        managerId: b.managerId || null,
        salary: Number(b.salary) || 0,
        employmentDate: b.employmentDate || nowISO(),
        status: b.status || "ACTIVE",
        activity: [],
    };
    const created = await table("employees").insert(emp);

    return res.json({ success: true, data: created });
});

export const updateEmployee = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const e = await table("employees").find("id = ? AND vendorId = ?", [req.params.employeeId, vendor.id]);
    if (!e) throw notFound("Employee not found");
    const b = body(req);
    const patch = {};
    for (const k of ["name", "email", "phone", "departmentId", "position", "managerId", "salary", "status"]) {
        if (b[k] !== undefined) patch[k] = b[k];
    }
    const updated = await table("employees").update(e.id, patch);

    return res.json({ success: true, data: updated });
});

/* --- attendance ------------------------------------------------------- */

export const listAttendance = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const rows = await table("attendance").all("vendorId = ?", [vendor.id]);
    const today = new Date().toISOString().slice(0, 10);
    const todayRows = rows.filter((a) => a.date === today);
    const summary = {
        employees: await table("employees").count("vendorId = ? AND status = ?", [vendor.id, "ACTIVE"]),
        present: todayRows.filter((a) => a.status === "PRESENT").length,
        absent: todayRows.filter((a) => a.status === "ABSENT").length,
        late: todayRows.filter((a) => a.status === "LATE").length,
        leave: todayRows.filter((a) => a.status === "LEAVE").length,
    };
    const items = await Promise.all(
        rows.map(async (a) => ({ ...a, employeeName: (await table("employees").get(a.employeeId))?.name }))
    );

    return res.json({
        success: true,
        data: {
            summary,
            items: sortItems(items.slice(-400), query(req), "date"),
        },
    });
});

export const createAttendance = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    const { employeeId, date, status } = b;
    if (!employeeId || !date || !status) {
        throw badRequest("Employee, date and status are required");
    }
    await table("attendance").insert({
        id: `att-${Date.now()}`,
        vendorId: vendor.id,
        employeeId,
        date,
        status,
        checkIn: null,
        checkOut: null,
        recordedBy: requireUser(req).id,
    });

    return res.json({ success: true, data: { message: "Attendance recorded" } });
});

/* --- leave ------------------------------------------------------------ */

export const listLeave = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "leave_requests", {
        searchKeys: ["employeeName", "type"],
        sortDefault: "appliedAt",
    });

    return res.json({ success: true, data: result });
});

export const createLeave = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const b = body(req);
    if (!b.employeeId || !b.type || !b.startDate || !b.endDate) {
        throw badRequest("Employee, type, start and end dates are required");
    }
    if (new Date(b.endDate) < new Date(b.startDate)) {
        throw badRequest("End date cannot be before start date");
    }
    const emp = await table("employees").get(b.employeeId);
    const leave = {
        id: `lv-${Date.now()}`,
        vendorId: vendor.id,
        employeeId: b.employeeId,
        employeeName: b.employeeName || emp?.name,
        type: b.type,
        startDate: b.startDate,
        endDate: b.endDate,
        days: Math.round((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000) + 1,
        reason: b.reason || "",
        status: "PENDING",
        appliedAt: nowISO(),
        reviewBy: null,
        reviewedAt: null,
        activity: [],
    };
    const created = await table("leave_requests").insert(leave);

    return res.json({ success: true, data: created });
});

export const transitionLeave = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, String(req.params.vendorId));
    const lv = await table("leave_requests").find("id = ? AND vendorId = ?", [req.params.leaveId, vendor.id]);
    if (!lv) throw notFound("Leave request not found");
    const b = body(req);
    const to = b.to;
    if (!canTransition(LEAVE_MAP, lv.status, to)) {
        throw badRequest(`Invalid leave transition ${lv.status} → ${to}`);
    }
    const reviewBy = requireUser(req).id;
    const reviewedAt = nowISO();
    await addAudit(req, "reviewed", "leave request", lv.id, `Leave request → ${to}`, vendor.id);
    const updated = await table("leave_requests").update(lv.id, { status: to, reviewBy, reviewedAt });

    return res.json({ success: true, data: updated });
});

const LEAVE_MAP = { PENDING: ["APPROVED", "REJECTED", "CANCELLED"], APPROVED: [], REJECTED: [], CANCELLED: [] };
