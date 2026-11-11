import express from "express";

import { register, login, me, refresh, logout, forgot, reset, change,} from "../../../controllers/auth.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";

const router = express.Router();


// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgot);
router.post("/reset-password", reset);


// Protected routes
router.get("/me", authenticate, me);
router.patch("/change-password", authenticate, change);


export default router;