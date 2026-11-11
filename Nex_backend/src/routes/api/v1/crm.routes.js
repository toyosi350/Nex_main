import express from "express";

import {
    listLeads,
    leadPipeline,
    createLead,
    updateLead,
} from "../../../controllers/crm.controller.js";

const router = express.Router();

router.get("/vendor/:vendorId/leads", listLeads);
router.get("/vendor/:vendorId/leads/pipeline", leadPipeline);
router.post("/vendor/:vendorId/leads", createLead);
router.patch("/vendor/:vendorId/leads/:leadId", updateLead);

export default router;
