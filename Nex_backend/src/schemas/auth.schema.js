import { z } from "zod";

/*
|--------------------------------------------------------------------
| Contract notes (mock server.js is the specification):
|
| The mock validated auth bodies with plain falsy checks inside each
| handler, e.g. `if (!email || !password) throw 400 'Email and
| password are required'`. Those checks — and their exact messages —
| live in the auth *service* so every case (missing key, empty
| string, wrong type) produces the contract status + message. These
| schemas therefore only describe the accepted body shape and
| normalise `remember`; they must not add format or length rules the
| mock never had (no .email(), no .min(8) on auth endpoints).
|
| `.optional()` on the unknown fields is what lets a missing key
| through to the service instead of failing zod first (zod v4 treats
| plain z.unknown() as nonoptional).
|
|   - register accepts the marketplace's `username` and the ERP's
|     `name` + `company` (string or { name, industry, plan }); which
|     one arrived is normalised in the service.
|   - logout takes no body in the contract — the mock ignored it and
|     the frontends send none — so the token is optional here and
|     revocation is best-effort in the service.
|--------------------------------------------------------------------
*/

export const registerSchema = z.object({
  name: z.unknown().optional(),
  username: z.unknown().optional(),
  email: z.unknown().optional(),
  password: z.unknown().optional(),
  company: z.unknown().optional(),
});

export const loginSchema = z.object({
  email: z.unknown().optional(),
  password: z.unknown().optional(),
  remember: z
    .coerce
    .boolean()
    .optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.unknown().optional(),
});

export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.unknown().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.unknown().optional(),
  token: z.unknown().optional(),
  password: z.unknown().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.unknown().optional(),
  newPassword: z.unknown().optional(),
});
