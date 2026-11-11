import express from "express";

import {
    listProjects,
    getProject,
    createProject,
    updateProject,
    listTasks,
    createTask,
    updateTask,
} from "../../../controllers/project.controller.js";

const router = express.Router();

router.get("/vendor/:vendorId/projects", listProjects);
router.get("/vendor/:vendorId/projects/:projectId", getProject);
router.post("/vendor/:vendorId/projects", createProject);
router.patch("/vendor/:vendorId/projects/:projectId", updateProject);
router.get("/vendor/:vendorId/tasks", listTasks);
router.post("/vendor/:vendorId/tasks", createTask);
router.patch("/vendor/:vendorId/tasks/:taskId", updateTask);

export default router;
