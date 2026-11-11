import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    try {
        const migrationsPath = path.join(__dirname, "migrations");

        /*
        |--------------------------------------------------------------------
        | Track applied migrations so files only run once.
        | The runner used to re-execute every .sql on each call, which is
        | fine for CREATE TABLE IF NOT EXISTS but destructive for DROP/ALTER
        | once real data exists.
        |--------------------------------------------------------------------
        */

        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const { rows } = await pool.query("SELECT filename FROM schema_migrations");
        const applied = new Set(rows.map((row) => row.filename));

        const files = fs
            .readdirSync(migrationsPath)
            .filter(file => file.endsWith(".sql"))
            .sort();

        for (const file of files) {
            if (applied.has(file)) continue;

            console.log(`Running migration: ${file}`);

            const sql = fs.readFileSync(
                path.join(migrationsPath, file),
                "utf8"
            );

            await pool.query(sql);

            await pool.query(
                "INSERT INTO schema_migrations (filename) VALUES ($1)",
                [file]
            );

            console.log(`Completed: ${file}`);
        }

        console.log("All migrations completed.");

    } catch (error) {
        console.error("Migration error:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigrations();
