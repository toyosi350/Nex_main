import AppError from "./app.error.js";

/*
|--------------------------------------------------------------------
| Shortcuts for the status codes contract routes throw with.
| Argument order matches AppError(message, statusCode).
|--------------------------------------------------------------------
*/

export const badRequest = (message) => new AppError(message, 400);
export const unauthorized = (message) => new AppError(message, 401);
export const forbidden = (message) => new AppError(message, 403);
export const notFound = (message) => new AppError(message, 404);
export const conflict = (message) => new AppError(message, 409);
export const unprocessable = (message) => new AppError(message, 422);
