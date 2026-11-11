import express from "express";
import { getUsers, getUserById, createUser, updateUser, patchUser, deleteUser } from "../../../controllers/users.controller.js";
import { validate } from '../../../middleware/validate.js';
import { createUserSchema } from '../../../schemas/user.schema.js';
import { patchUserSchema } from '../../../schemas/user.schema.js';
import { putUserSchema } from '../../../schemas/user.schema.js';
import authenticate from "../../../middleware/auth.middleware.js";

const router = express.Router();

/* Every route manages user records; none of them are public. */
router.use(authenticate);

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post('/', validate(createUserSchema), createUser);

router.put("/:id", validate(putUserSchema), updateUser);

router.patch("/:id", validate(patchUserSchema), patchUser);

router.delete("/:id", deleteUser);

export default router;