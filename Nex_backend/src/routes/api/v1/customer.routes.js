import express from "express";

import {
    listCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from "../../../controllers/customer.controller.js";

const router = express.Router();

router.get("/vendor/:vendorId/customers", listCustomers);
router.get("/vendor/:vendorId/customers/:customerId", getCustomer);
router.post("/vendor/:vendorId/customers", createCustomer);
router.patch("/vendor/:vendorId/customers/:customerId", updateCustomer);
router.delete("/vendor/:vendorId/customers/:customerId", deleteCustomer);

export default router;
