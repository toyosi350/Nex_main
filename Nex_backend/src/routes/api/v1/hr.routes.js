import express from "express";

import {
    getDepartments,
    createDepartment,
    listEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    listAttendance,
    createAttendance,
    listLeave,
    createLeave,
    transitionLeave,
} from "../../../controllers/hr.controller.js";

/**
 * HR — departments, employees, attendance, leave (mock server.js 1886–2067).
 *
 * Return shapes deliberately differ per endpoint: the department and attendance
 * endpoints return bare/bespoke objects, the employee and leave lists return
 * the paginated `vendorList` envelope. Copied from the mock, not normalised.
 *
 * `leave` collection -> `leave_requests` table (see ROUTE_CONTRACT.md).
 */
const router = express.Router();

/* --- departments ------------------------------------------------------ */

router.get("/vendor/:vendorId/departments", getDepartments);
router.post("/vendor/:vendorId/departments", createDepartment);

/* --- employees -------------------------------------------------------- */

router.get("/vendor/:vendorId/employees", listEmployees);
router.get("/vendor/:vendorId/employees/:employeeId", getEmployee);
router.post("/vendor/:vendorId/employees", createEmployee);
router.patch("/vendor/:vendorId/employees/:employeeId", updateEmployee);

/* --- attendance ------------------------------------------------------- */

router.get("/vendor/:vendorId/attendance", listAttendance);
router.post("/vendor/:vendorId/attendance", createAttendance);

/* --- leave ------------------------------------------------------------ */

router.get("/vendor/:vendorId/leave", listLeave);
router.post("/vendor/:vendorId/leave", createLeave);
router.post("/vendor/:vendorId/leave/:leaveId/transition", transitionLeave);

export default router;
