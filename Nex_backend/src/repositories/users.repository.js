import pool from "../config/db.js";

export const findAllUsers = async () => {
    const result = await pool.query("SELECT * FROM users");

    return result.rows;
};

export const findUserById = async (id) => {
    const result = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [id]
    );

    return result.rows[0];
};

export const createUser = async (email, passwordHash) => {
    const result = await pool.query(
        `INSERT INTO users (id, email, password_hash)
         VALUES (
            'u-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS')
                 || '-' || floor(random() * 900 + 100)::text,
            $1,
            $2
         )
         RETURNING *`,
        [email, passwordHash]
    );

    return result.rows[0];
};

export const updateUser = async (
    id,
    email,
    passwordHash,
    accountType,
    status
) => {
    const result = await pool.query(
        `UPDATE users
         SET email = $1,
             password_hash = $2,
             account_type = $3,
             status = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [email, passwordHash, accountType, status, id]
    );

    return result.rows[0];
};

export const patchUser = async (
    id,
    email,
    passwordHash,
    accountType,
    status
) => {
    const result = await pool.query(
        `UPDATE users
         SET email = COALESCE($1, email),
             password_hash = COALESCE($2, password_hash),
             account_type = COALESCE($3, account_type),
             status = COALESCE($4, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [email, passwordHash, accountType, status, id]
    );

    return result.rows[0];
};

export const deleteUser = async (id) => {
    const result = await pool.query(
        `DELETE FROM users
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0];
};