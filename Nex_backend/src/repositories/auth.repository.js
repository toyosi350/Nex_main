import pool from "../config/db.js";

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/

/*
| Every user lookup returns the contract's user fields (see the
| frontend's mock: id, vendorId, name, email, role, status, phone,
| lastLogin, permissions) alongside the auth columns this layer needs.
| The service maps snake_case rows to that shape in toContractUser().
*/

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `
      SELECT
        id,
        vendor_id,
        name,
        email,
        role,
        account_type,
        status,
        phone,
        last_login,
        permissions,
        password_hash,
        created_at,
        updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `,
    [email]
  );

  return result.rows[0];
};

export const findUserById = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        id,
        vendor_id,
        name,
        email,
        role,
        account_type,
        status,
        phone,
        last_login,
        permissions,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0];
};

export const findUserWithPasswordById = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        id,
        vendor_id,
        name,
        email,
        role,
        account_type,
        status,
        phone,
        last_login,
        permissions,
        password_hash,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0];
};

export const createUser = async ({
  id,
  vendorId = null,
  name = null,
  email,
  passwordHash,
  role = "EMPLOYEE",
  phone = "",
  lastLogin = null,
}) => {
  const result = await pool.query(
    `
      INSERT INTO users (
        id,
        vendor_id,
        name,
        email,
        role,
        status,
        phone,
        last_login,
        password_hash
      )
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7, $8)
      RETURNING *
    `,
    [id, vendorId, name, email, role, phone, lastLogin, passwordHash]
  );

  return result.rows[0];
};

export const updateUserLastLogin = async (userId, lastLogin) => {
  await pool.query(
    `
      UPDATE users
      SET
        last_login = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [lastLogin, userId]
  );
};

export const updateUserPassword = async (
  userId,
  passwordHash
) => {
  const result = await pool.query(
    `
      UPDATE users
      SET
        password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `,
    [passwordHash, userId]
  );

  return result.rows[0];
};

/*
|--------------------------------------------------------------------------
| REFRESH TOKENS
|--------------------------------------------------------------------------
*/

export const createRefreshToken = async (
  userId,
  token,
  expiresAt
) => {
  const result = await pool.query(
    `
      INSERT INTO refresh_tokens (
        user_id,
        token,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, token, expiresAt]
  );

  return result.rows[0];
};

export const findRefreshToken = async (token) => {
  const result = await pool.query(
    `
      SELECT *
      FROM refresh_tokens
      WHERE token = $1
    `,
    [token]
  );

  return result.rows[0];
};

export const deleteRefreshToken = async (token) => {
  await pool.query(
    `
      DELETE FROM refresh_tokens
      WHERE token = $1
    `,
    [token]
  );
};

export const deleteAllUserRefreshTokens = async (
  userId
) => {
  await pool.query(
    `
      DELETE FROM refresh_tokens
      WHERE user_id = $1
    `,
    [userId]
  );
};

/*
|--------------------------------------------------------------------------
| PASSWORD RESET TOKENS
|--------------------------------------------------------------------------
*/

export const createPasswordResetToken = async (
  userId,
  token,
  expiresAt
) => {
  const result = await pool.query(
    `
      INSERT INTO password_reset_tokens (
        user_id,
        token,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, token, expiresAt]
  );

  return result.rows[0];
};

export const findPasswordResetToken = async (
  token
) => {
  const result = await pool.query(
    `
      SELECT *
      FROM password_reset_tokens
      WHERE token = $1
    `,
    [token]
  );

  return result.rows[0];
};

export const deletePasswordResetToken = async (
  token
) => {
  await pool.query(
    `
      DELETE FROM password_reset_tokens
      WHERE token = $1
    `,
    [token]
  );
};

export const deleteUserPasswordResetTokens = async (
  userId
) => {
  await pool.query(
    `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1
    `,
    [userId]
  );
};