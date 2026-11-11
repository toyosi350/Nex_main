import express from "express";

import {
    listNotifications,
    markNotificationRead,
    markAllRead,
    listAuditLogs,
    search,
} from "../../../controllers/platform.controller.js";

const router = express.Router();

router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.post("/notifications/read-all", markAllRead);
router.get("/audit-logs", listAuditLogs);
router.get("/search", search);

export default router;
