/**
 * Drops and recreates the `public` schema — a clean slate before
 * `node src/database/migrate.js && node src/database/seed.js`.
 * Dev only; there is no data worth keeping.
 */
import pool from "../src/config/db.js";

await pool.query("DROP SCHEMA public CASCADE");
await pool.query("CREATE SCHEMA public");
console.log("Schema public reset");

await pool.end();
