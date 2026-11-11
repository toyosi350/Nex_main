import express from "express";

import {
    dashboard,
    listVendors,
    getVendor,
    createVendor,
    updateVendor,
    vendorStatus,
    deleteVendor,
    listVendorUsers,
    addVendorUser,
    updateVendorUser,
    listUsers,
    updateUser,
} from "../../../controllers/admin.controller.js";

const router = express.Router();

router.get("/admin/dashboard", dashboard);

router.get("/admin/vendors", listVendors);

router.get("/admin/vendors/:vendorId", getVendor);

router.post("/admin/vendors", createVendor);

router.patch("/admin/vendors/:vendorId", updateVendor);

router.post("/admin/vendors/:vendorId/status", vendorStatus);

router.delete("/admin/vendors/:vendorId", deleteVendor);

router.get("/admin/vendors/:vendorId/users", listVendorUsers);

router.post("/admin/vendors/:vendorId/users", addVendorUser);

router.patch("/admin/vendors/:vendorId/users/:userId", updateVendorUser);

router.get("/admin/users", listUsers);

router.patch("/admin/users/:userId", updateUser);

export default router;
