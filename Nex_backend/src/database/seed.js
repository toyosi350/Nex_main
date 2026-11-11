import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeds() {
    const client = await pool.connect();

    try {
        const seedsPath = path.join(__dirname, "seeds");

        const files = fs
            .readdirSync(seedsPath)
            .filter(file => file.endsWith(".sql"))
            .sort();

        await client.query("BEGIN");

        for (const file of files) {
            console.log(`Running seed: ${file}`);

            const sql = fs.readFileSync(
                path.join(seedsPath, file),
                "utf8"
            );

            await client.query(sql);

            console.log(`Completed: ${file}`);
        }

        await client.query("COMMIT");

        console.log("All seeds completed successfully.");

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Seed error:", error);

    } finally {
        client.release();
        await pool.end();
    }
}

runSeeds();