import express from "express";

import { getReport } from "../../../controllers/report.controller.js";

const router = express.Router();

router.get("/vendor/:vendorId/reports/:reportType", getReport);

export default router;
