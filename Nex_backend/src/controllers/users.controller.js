import { getUsers as getUsersService, getUserById as getUserByIdService, createUser as createUserService, updateUser as updateUserService, patchUser as patchUserService, deleteUser as deleteUserService} from "../services/users.service.js";
import AppError from '../errors/app.error.js';
import asyncMiddleware from '../middleware/async.middleware.js';

export const getUsers = asyncMiddleware( async (req, res) => {
        const users = await getUsersService();

        res.json({success: true, data: users});
});

export const getUserById = asyncMiddleware(async (req, res) => {
        const user = await getUserByIdService(req.params.id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({success: true, data: user});

});

export const createUser = asyncMiddleware(async (req, res) => {
        const { email, password_hash } = req.body;

        const user = await createUserService(email, password_hash);

        res.status(201).json({success: true, data: user});
    
});

export const updateUser = asyncMiddleware( async (req, res) => {
        const { id } = req.params;

        const {
            email,
            password_hash,
            account_type,
            status
        } = req.body;

        const user = await updateUserService(
            id,
            email,
            password_hash,
            account_type,
            status
        );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({success: true, data: user});
});


export const patchUser = asyncMiddleware(async (req, res) => {
        const { id } = req.params;

        const { email, password_hash, account_type, status} = req.body;

        const user = await patchUserService(id, email, password_hash, account_type, status);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({success: true, data: user});
});


export const deleteUser = asyncMiddleware(async (req, res) => {
        const { id } = req.params;

        const user = await deleteUserService(id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({
            success: true,
            data: {
                message: "User deleted successfully",
                user
            }
        });
});