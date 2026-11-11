import pg from "pg";
import { env } from "./env.js";
 
const { Pool } = pg;

/*
| NUMERIC columns come back from Postgres as strings by default, which
| would ship prices and totals to the frontend as "6200.00" and break
| arithmetic in the UI. Parse them to numbers once, here.
*/
pg.types.setTypeParser(1700, (value) => parseFloat(value));

 const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password
});


export default pool;