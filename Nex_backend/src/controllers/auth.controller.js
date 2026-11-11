import asyncHandler from "../middleware/async.middleware.js";

import {
    registerUser,
    loginUser,
    getCurrentUser,
    refreshAccessToken,
    logoutUser,
    forgotPassword,
    resetPassword,
    changePassword,
} from "../services/auth.service.js";

import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from "../schemas/auth.schema.js";


export const register = asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body ?? {});

    const result = await registerUser(data);

    return res.status(201).json({
        success: true,
        data: result,
    });
});


export const login = asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body ?? {});

    const result = await loginUser(data, req);

    return res.status(200).json({
        success: true,
        data: result,
    });
});


export const me = asyncHandler(async (req, res) => {
    const result = await getCurrentUser(req.user.userId);

    return res.status(200).json({
        success: true,
        data: result,
    });
});


export const refresh = asyncHandler(async (req, res) => {
    const data = refreshTokenSchema.parse(req.body ?? {});

    const result = await refreshAccessToken(
        data.refreshToken
    );

    return res.status(200).json({
        success: true,
        data: result,
    });
});


export const logout = asyncHandler(async (req, res) => {
    const data = logoutSchema.parse(req.body ?? {});

    await logoutUser(data.refreshToken);

    return res.status(200).json({
        success: true,
        message: "Logged out",
    });
});


export const forgot = asyncHandler(async (req, res) => {
    const data = forgotPasswordSchema.parse(req.body ?? {});

    const resetToken = await forgotPassword(data.email);

    return res.status(200).json({
        success: true,
        message:
            "If the email exists, a reset link has been sent.",
        ...(resetToken && {
            resetToken,
        }),
    });
});


export const reset = asyncHandler(async (req, res) => {
    const data = resetPasswordSchema.parse(req.body ?? {});

    await resetPassword(data);

    return res.status(200).json({
        success: true,
        message: "Password reset successfully. You can now sign in.",
    });
});


export const change = asyncHandler(async (req, res) => {
    const data = changePasswordSchema.parse(req.body ?? {});

    await changePassword(
        req.user.userId,
        data.currentPassword,
        data.newPassword
    );

    return res.status(200).json({
        success: true,
        message: "Password changed successfully",
    });
});