import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email(),
    password_hash: z.string().min(8),
    account_type: z.string().optional(),// We have to change this to an enum later e.g z.enum(["ADMIN", "USER", "EMPLOYEE", "GUEST"])
    status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const patchUserSchema = z.object({
    email: z.string().email().optional(),
    password_hash: z.string().min(8).optional(),
    account_type: z.string().optional(),
    status: z.string().optional()
});

export const putUserSchema = z.object({
    email: z.string().email(),
    password_hash: z.string().min(8),
    account_type: z.string(),
    status: z.string()
});