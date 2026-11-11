import express from "express";

import {
    listCategories,
    createCategory,
    listProducts,
    getProduct,
    createProduct,
    updateProduct,
    listWarehouses,
    getWarehouse,
} from "../../../controllers/catalog.controller.js";

/**
 * CATEGORIES / PRODUCTS / WAREHOUSES — port of services/mock/server.js
 * lines 770-926. Paths are the mock's full paths, carried verbatim.
 */
const router = express.Router();

/* ================= CATEGORIES / PRODUCTS ================= */

router.get("/vendor/:vendorId/categories", listCategories);
router.post("/vendor/:vendorId/categories", createCategory);
router.get("/vendor/:vendorId/products", listProducts);
router.get("/vendor/:vendorId/products/:productId", getProduct);
router.post("/vendor/:vendorId/products", createProduct);
router.patch("/vendor/:vendorId/products/:productId", updateProduct);

/* ================= WAREHOUSES ================= */

router.get("/vendor/:vendorId/warehouses", listWarehouses);
router.get("/vendor/:vendorId/warehouses/:warehouseId", getWarehouse);

export default router;
