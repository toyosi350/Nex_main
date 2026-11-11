import express from "express";

import { listProducts } from "../../../controllers/products.controller.js";

const router = express.Router();

// Marketplace catalog for the Nex-IV storefront
router.get("/", listProducts);

export default router;
