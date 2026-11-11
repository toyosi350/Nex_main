import crypto from "crypto";
import { findUserByEmail, findUserById, findUserWithPasswordById, createUser, updateUserPassword, updateUserLastLogin, createRefreshToken, findRefreshToken, deleteRefreshToken, deleteAllUserRefreshTokens, createPasswordResetToken, findPasswordResetToken, deletePasswordResetToken, deleteUserPasswordResetTokens,} from "../repositories/auth.repository.js";
import { hashPassword, comparePassword, } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, } from "../utils/jwt.js";
import { nowISO } from "../utils/http.js";
import table from "../repositories/table.js";
import AppError from "../errors/app.error.js";

/*
|--------------------------------------------------------------------
| The frontend reads these exact fields off every /auth/* payload —
| this is the mock's user shape (id, vendorId, name, email, role,
| status, phone, lastLogin, permissions) with `username` aliased for
| the marketplace header, which renders that instead of `name`.
|--------------------------------------------------------------------
*/

const toContractUser = (user) => ({
  id: user.id,
  vendorId: user.vendor_id ?? null,
  name: user.name ?? null,
  email: user.email,
  role: user.role,
  status: user.status,
  phone: user.phone ?? null,
  lastLogin: user.last_login ?? null,
  permissions: user.permissions ?? null,
  username: user.name || user.email,
});

const vendorFor = async (user) => {
  if (!user.vendor_id) return null;
  return (await table("vendors").get(user.vendor_id)) ?? null;
};

/*
|--------------------------------------------------------------------
| Signs an access + refresh token pair and records the refresh token
| so logout/refresh can revoke it. Access tokens carry role/vendorId
| claims so tenant checks need no database lookup.
|--------------------------------------------------------------------
*/

const issueTokens = async (user, remember = false) => {
  const accessToken = generateAccessToken(
    user.id,
    { role: user.role, vendorId: user.vendor_id ?? null },
    remember
  );

  const refreshToken = generateRefreshToken(user.id);

  const refreshTokenExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await createRefreshToken(
    user.id,
    refreshToken,
    refreshTokenExpiresAt
  );

  return { accessToken, refreshToken };
};

/*
|--------------------------------------------------------------------
| REGISTER
|
| Contract (mock): 400 'Name, email and password are required',
| 409 'An account with this email already exists'. The marketplace
| sends `username`, the ERP sends `name` + `company` — either way the
| display name lands in `name`. A company matching an existing vendor
| tenant joins that tenant as VENDOR_ADMIN, everyone else starts as
| SUPER_ADMIN (the mock's rule).
|--------------------------------------------------------------------
*/

export const registerUser = async ({ name, username, email, password, company, }) => {
  const displayName = name || username;

  if (!displayName || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  const existingUser = await findUserByEmail(String(email));

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  /* company arrives as a plain string or the ERP's { name, industry, plan } */
  const companyName =
    typeof company === "string" ? company : company?.name;

  const vendor = companyName
    ? await table("vendors").find("LOWER(company) = ?", [
        String(companyName).toLowerCase(),
      ])
    : undefined;

  const passwordHash = await hashPassword(String(password));

  const user = await createUser({
    id: `u-${Date.now()}`,
    vendorId: vendor?.id ?? null,
    name: displayName,
    email,
    passwordHash,
    role: vendor ? "VENDOR_ADMIN" : "SUPER_ADMIN",
    phone: "",
    lastLogin: nowISO(),
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: toContractUser(user),
    message: "Account created successfully",
    accessToken,
    refreshToken,
  };
};

/*
|--------------------------------------------------------------------
| LOGIN
|
| Contract (mock): 400 'Email and password are required', 401
| 'Invalid email or password', 403 'This account is inactive'.
| Credentials are checked before account status, exactly like the
| mock. Every sign-in stamps lastLogin and writes the same audit row
| the mock did.
|--------------------------------------------------------------------
*/

export const loginUser = async ({ email, password, remember, }, req) => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await findUserByEmail(String(email));

  if (!user) {
    throw new AppError( "Invalid email or password", 401);
  }

  /*
  |--------------------------------------------------------------------
  | Compare password (mock: credentials before status)
  |--------------------------------------------------------------------
  */

  const passwordMatches =
    await comparePassword(
      String(password),
      user.password_hash
    );

  if (!passwordMatches) {
    throw new AppError( "Invalid email or password", 401);
  }

  /*
  |--------------------------------------------------------------------
  | Check account status
  |--------------------------------------------------------------------
  */

  if (user.status !== "ACTIVE") {
    throw new AppError("This account is inactive", 403);
  }

  /*
  |--------------------------------------------------------------------
  | Generate tokens (remember me holds the session for 7 days)
  |--------------------------------------------------------------------
  */

  const { accessToken, refreshToken } =
    await issueTokens(user, !!remember);

  /*
  |--------------------------------------------------------------------
  | Stamp lastLogin + audit trail (mock behaviour)
  |--------------------------------------------------------------------
  */

  const lastLogin = nowISO();

  await updateUserLastLogin(user.id, lastLogin);
  user.last_login = lastLogin;

  await table("audit_logs").insert({
    id: `aud-${Date.now()}-lg`,
    vendorId: user.vendor_id ?? null,
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: "logged in",
    entity: "account",
    entityId: user.id,
    detail: `${user.name} signed in to Nex-IV`,
    ip: req?.ip || "127.0.0.1",
    device: "Chrome / Windows",
    at: lastLogin,
  });

  /*
  |--------------------------------------------------------------------
  | Contract payload: tokens + user + vendor
  |--------------------------------------------------------------------
  */

  return {
    message: "Login successful",
    user: toContractUser(user),
    vendor: await vendorFor(user),
    accessToken,
    refreshToken,
  };
};

/*
|--------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------
*/

export const getCurrentUser = async (
  userId
) => {
  const user =
    await findUserById(userId);

  if (!user) {
    throw new AppError("Session invalid", 401);
  }

  /* mock: { user, vendor } */
  return {
    user: toContractUser(user),
    vendor: await vendorFor(user),
  };
};

/*
|--------------------------------------------------------------------
| REFRESH ACCESS TOKEN
|--------------------------------------------------------------------
*/

export const refreshAccessToken = async (
  rawRefreshToken
) => {
  /* the mock decoded `String(refresh || '')` — anything unparseable
     (missing, empty, garbage) is the same 401 */
  const refreshToken = String(rawRefreshToken ?? "");

  const storedToken =
    await findRefreshToken(
      refreshToken
    );

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  /*
  |--------------------------------------------------------------------
  | Check database expiration
  |--------------------------------------------------------------------
  */

  if (
    new Date(storedToken.expires_at) <
    new Date()
  ) {
    await deleteRefreshToken(
      refreshToken
    );

    throw new AppError("Invalid refresh token", 401);
  }

  /*
  |--------------------------------------------------------------------
  | Verify JWT
  |--------------------------------------------------------------------
  */

  let payload;

  try {
    payload =
      verifyRefreshToken(
        refreshToken
      );
  } catch {
    await deleteRefreshToken(
      refreshToken
    );

    throw new AppError("Invalid refresh token", 401);
  }

  /*
  |--------------------------------------------------------------------
  | Make sure token belongs to same user
  |--------------------------------------------------------------------
  */

  if (
    payload.userId !==
    storedToken.user_id
  ) {
    throw new AppError("Invalid refresh token", 401);
  }

  /*
  |--------------------------------------------------------------------
  | Make sure user still exists
  |--------------------------------------------------------------------
  */

  const user =
    await findUserById(
      storedToken.user_id
    );

  if (!user) {
    await deleteRefreshToken(
      refreshToken
    );

    /* the mock's refresh reports a vanished account as a bad token */
    throw new AppError("Invalid refresh token", 401);
  }

  /* no status gate here: the mock (and reference) refresh a session
     regardless of account status — login is where INACTIVE is enforced */

  const accessToken =
    generateAccessToken(
      user.id,
      { role: user.role, vendorId: user.vendor_id ?? null },
      true
    );

  /* mock returns the fresh access token plus the session's user/vendor */
  return {
    accessToken,
    user: toContractUser(user),
    vendor: await vendorFor(user),
  };
};

/*
|--------------------------------------------------------------------
| LOGOUT
|
| The mock ignored the body entirely — both frontends send none — so
| a missing token is a no-op success, and a present one is revoked.
|--------------------------------------------------------------------
*/

export const logoutUser = async (
  refreshToken
) => {
  if (!refreshToken) {
    return;
  }

  await deleteRefreshToken(
    refreshToken
  );
};

/*
|--------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------
*/

export const forgotPassword = async (
  email
) => {
  /* mock lowercases both sides — any string (even empty) reaches the
     lookup and yields 404 when nothing matches */
  const user =
    await findUserByEmail(String(email ?? ""));

  /*
    Contract (mock): 404 when the account does not exist.
  */

  if (!user) {
    throw new AppError(
      "No account found with that email address",
      404
    );
  }

  /*
   Remove previous reset tokens.
  */

  await deleteUserPasswordResetTokens(
    user.id
  );

  /*
   Generate secure random token.
  */

  const token =
    crypto
      .randomBytes(32)
      .toString("hex");

  /*
   Token expires in 15 minutes.
  */

  const expiresAt = new Date(
    Date.now() +
      15 * 60 * 1000
  );

  await createPasswordResetToken(
    user.id,
    token,
    expiresAt
  );

  /*
   Development only: the response carries the token so the reset form
   can be completed without a mail service.
  */

  console.log(
    `Password reset token for ${user.email}: ${token}`
  );

  return token;
};

/*
|--------------------------------------------------------------------
| RESET PASSWORD
|
| Contract (mock): 400 'All fields are required', 404 'Account not
| found'. On top of that the token is validated against
| password_reset_tokens and must belong to that same account (the
| mock accepted any non-empty string — a real reset flow cannot);
| the ERP carries the token from the forgot response.
|--------------------------------------------------------------------
*/

export const resetPassword = async ({
  email,
  token,
  password,
}) => {
  if (!email || !password || !token) {
    throw new AppError("All fields are required", 400);
  }

  const account = await findUserByEmail(String(email));

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  const resetToken =
    await findPasswordResetToken(
      String(token)
    );

  if (!resetToken || resetToken.user_id !== account.id) {
    throw new AppError(
      "Invalid or expired reset token",
      400
    );
  }

  if (
    new Date(resetToken.expires_at) <
    new Date()
  ) {
    await deletePasswordResetToken(
      String(token)
    );

    throw new AppError(
      "Invalid or expired reset token",
      400
    );
  }

  const passwordHash =
    await hashPassword(String(password));

  await updateUserPassword(
    account.id,
    passwordHash
  );

  /*
   Invalidate all existing sessions.
  */

  await deleteAllUserRefreshTokens(
    account.id
  );

  /*
   Reset token can only be used once.
  */

  await deletePasswordResetToken(
    String(token)
  );
};

/*
|--------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------
*/

export const changePassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user =
    await findUserWithPasswordById(
      userId
    );

  if (!user) {
    throw new AppError(
      "Session invalid",
      401
    );
  }

  if (!currentPassword || !newPassword) {
    throw new AppError(
      "Both passwords are required",
      400
    );
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must differ from current password",
      400
    );
  }

  const passwordMatches =
    await comparePassword(
      String(currentPassword),
      user.password_hash
    );

  if (!passwordMatches) {
    throw new AppError( "Current password is incorrect", 401);
  }

  const passwordHash =
    await hashPassword(
      String(newPassword)
    );

  await updateUserPassword(
    userId,
    passwordHash
  );

  /*
   Invalidate all existing refresh sessions.
  */

  await deleteAllUserRefreshTokens(
    userId
  );
};
