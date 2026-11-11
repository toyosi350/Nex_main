import express from "express";

import {
    listSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
} from "../../../controllers/supplier.controller.js";

const router = express.Router();

router.get("/vendor/:vendorId/suppliers", listSuppliers);
router.get("/vendor/:vendorId/suppliers/:supplierId", getSupplier);
router.post("/vendor/:vendorId/suppliers", createSupplier);
router.patch("/vendor/:vendorId/suppliers/:supplierId", updateSupplier);

export default router;
