import pool from "../config/db.js";
import { notFound } from "../errors/api.errors.js";

/*
|--------------------------------------------------------------------
| Generic data-access object for one table.
|
| This mirrors the reference backend's `table()` API so contract routes
| port over almost mechanically, but it is async (Postgres) instead of
| sync (SQLite). Key behaviours:
|
|   - `?` placeholders are translated to `$1, $2, …` and camelCase
|     identifiers in WHERE/ORDER strings are translated to snake_case,
|     so callers keep writing `where("vendorId = ?")` style clauses.
|   - Rows cross the boundary as camelCase objects (what the frontend
|     contract uses); columns are snake_case (what this repo writes).
|   - Columns declared JSONB are serialised on write and arrive
|     parsed on read; BOOLEAN behaves natively.
|   - Unknown keys a route invents are parked in the `extra` JSONB
|     column (same as the reference backend) and unpacked on read,
|     including its `__absent` bookkeeping so "absent" stays absent
|     instead of reading back as null.
|--------------------------------------------------------------------
*/

const cache = new Map();

const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const snake = (s) =>
    s.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase();

const quoteIdent = (name) => `"${name.replace(/"/g, '""')}"`;

/*
|--------------------------------------------------------------------
| Translate a reference-style SQL fragment: `?` -> $n (in order) and
| bare identifiers camelCase -> snake_case. Single-quoted string
| literals are copied through untouched. SQL keywords are case
| insensitive in Postgres, so lowercasing them along the way is safe.
|--------------------------------------------------------------------
*/
function translate(sql, startAt = 1) {
    let out = "";
    let n = startAt;
    let i = 0;
    let quote = null;
    let afterAs = false;

    while (i < sql.length) {
        const ch = sql[i];

        if (quote) {
            out += ch;
            if (ch === quote) {
                /* '' or "" is an escaped quote inside the segment */
                if (sql[i + 1] === quote) {
                    out += sql[i + 1];
                    i += 2;
                    continue;
                }
                quote = null;
            }
            i += 1;
            continue;
        }

        if (ch === "'" || ch === '"') {
            quote = ch;
            out += ch;
            i += 1;
            continue;
        }

        if (ch === "?") {
            out += `$${n}`;
            n += 1;
            i += 1;
            continue;
        }

        if (/[A-Za-z_]/.test(ch)) {
            let word = ch;
            i += 1;
            while (i < sql.length && /[A-Za-z0-9_]/.test(sql[i])) {
                word += sql[i];
                i += 1;
            }
            if (word.toUpperCase() === "AS") {
                afterAs = true;
                out += word;
                continue;
            }
            /* aliases after AS and function names such as LOWER( stay verbatim —
               the JSON keys a report returns depend on the alias spelling */
            if (afterAs || sql[i] === "(") {
                afterAs = false;
                out += word;
                continue;
            }
            out += snake(word);
            continue;
        }

        out += ch;
        i += 1;
    }

    return { sql: out, params: n - startAt };
}

async function describe(name) {
    const cached = cache.get(name);
    if (cached) return cached;

    const { rows } = await pool.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $1
           AND table_schema = 'public'
         ORDER BY ordinal_position`,
        [name]
    );

    if (!rows.length) {
        throw new Error(`table "${name}" does not exist — run npm run migrate`);
    }

    const pkResult = await pool.query(
        `SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
             ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
         WHERE tc.table_name = $1
           AND tc.table_schema = 'public'
           AND tc.constraint_type = 'PRIMARY KEY'`,
        [name]
    );

    const columns = rows.map((r) => r.column_name);
    const columnSet = new Set(columns);
    const camelMap = new Map(columns.map((c) => [camel(c), c]));
    const jsonCols = new Set(
        rows.filter((r) => r.data_type.toLowerCase() === "jsonb").map((r) => r.column_name)
    );
    const boolCols = new Set(
        rows.filter((r) => r.data_type.toLowerCase() === "boolean").map((r) => r.column_name)
    );
    const pk = pkResult.rows[0]?.column_name || columns[0];
    const hasExtra = columnSet.has("extra");

    const info = {
        name,
        columns,
        columnSet,
        camelMap,
        jsonCols,
        boolCols,
        pk,
        hasExtra,
        /* snake column -> camel field, for reading */
        out: new Map(columns.map((c) => [c, camel(c)])),
    };

    cache.set(name, info);
    return info;
}

/** Postgres row -> camelCase contract object */
function hydrate(info, raw) {
    const out = {};
    for (const [col, field] of info.out) {
        out[field] = raw[col];
    }

    if (info.hasExtra) {
        const extra = out.extra;
        delete out.extra;
        if (typeof extra === "string" && extra) {
            try {
                const parsed = JSON.parse(extra);
                const absent = parsed.__absent;
                delete parsed.__absent;
                Object.assign(out, parsed);
                /* a column the source row never had must come back absent, not null */
                if (Array.isArray(absent)) for (const k of absent) delete out[k];
            } catch {
                /* leave it */
            }
        } else if (extra && typeof extra === "object") {
            const absent = extra.__absent;
            const rest = { ...extra };
            delete rest.__absent;
            Object.assign(out, rest);
            if (Array.isArray(absent)) for (const k of absent) delete out[k];
        }
    }

    return out;
}

/** camelCase contract object -> bound params for this table */
function dehydrate(info, row) {
    const bound = {};
    const extra = {};

    for (const [key, value] of Object.entries(row)) {
        if (key === "extra") continue;

        const col = info.camelMap.get(key);
        if (col === undefined) {
            /* unknown keys are parked in `extra` exactly like the reference */
            if (info.hasExtra && key !== info.pk) extra[key] = value === undefined ? null : value;
            continue;
        }

        if (value === undefined || value === null) {
            bound[col] = null;
        } else if (info.jsonCols.has(col)) {
            /* stringify arrays too — node-pg would otherwise encode them as
               Postgres array literals, which a jsonb column rejects */
            bound[col] = typeof value === "string" ? value : JSON.stringify(value);
        } else {
            bound[col] = value;
        }
    }

    if (info.hasExtra) {
        /* columns this row simply didn't carry are recorded so `hydrate` can
           delete them again — otherwise "absent" would read back as "null" */
        const absent = Object.keys(info.camelMap).filter(
            (field) => field !== camel(info.pk) && !(field in row)
        );
        if (absent.length) extra.__absent = absent;
        bound.extra = Object.keys(extra).length ? JSON.stringify(extra) : null;
    }

    return bound;
}

function buildWhere(where, params) {
    if (!where) return { clause: "", count: 0 };
    const t = translate(where);
    return { clause: ` WHERE ${t.sql}`, count: t.params };
}

export const table = (name) => {
    const api = {
        name,

        async get(id) {
            const info = await describe(name);
            const result = await pool.query(
                `SELECT * FROM ${quoteIdent(name)} WHERE ${quoteIdent(info.pk)} = $1`,
                [id]
            );
            return result.rows[0] ? hydrate(info, result.rows[0]) : undefined;
        },

        async require(id, message = "Not found") {
            const row = await api.get(id);
            if (!row) throw notFound(message);
            return row;
        },

        async find(where, params = []) {
            const info = await describe(name);
            const { clause, count } = buildWhere(where, params);
            if (count !== params.length) {
                throw new Error(`${name}.find: ${params.length} params for ${count} placeholders`);
            }
            const result = await pool.query(
                `SELECT * FROM ${quoteIdent(name)}${clause} LIMIT 1`,
                params
            );
            return result.rows[0] ? hydrate(info, result.rows[0]) : undefined;
        },

        async all(where, params = [], opts = {}) {
            const info = await describe(name);
            const { clause, count } = buildWhere(where, params);
            if (count !== params.length) {
                throw new Error(`${name}.all: ${params.length} params for ${count} placeholders`);
            }
            let sql = `SELECT * FROM ${quoteIdent(name)}${clause}`;
            if (opts.order) sql += ` ORDER BY ${translate(opts.order).sql}`;
            if (opts.limit !== undefined) {
                sql += ` LIMIT ${Math.max(0, Math.floor(opts.limit))}`;
                if (opts.offset !== undefined) {
                    sql += ` OFFSET ${Math.max(0, Math.floor(opts.offset))}`;
                }
            }
            const result = await pool.query(sql, params);
            return result.rows.map((row) => hydrate(info, row));
        },

        async ids(where, params = []) {
            const info = await describe(name);
            const { clause } = buildWhere(where, params);
            const result = await pool.query(
                `SELECT ${quoteIdent(info.pk)} AS id FROM ${quoteIdent(name)}${clause}`,
                params
            );
            return result.rows.map((r) => String(r.id));
        },

        async count(where, params = []) {
            const { clause } = buildWhere(where, params);
            const result = await pool.query(
                `SELECT COUNT(*)::int AS n FROM ${quoteIdent(name)}${clause}`,
                params
            );
            return Number(result.rows[0]?.n ?? 0);
        },

        async exists(where, params = []) {
            return (await api.count(where, params)) > 0;
        },

        async insert(row) {
            const info = await describe(name);
            const bound = dehydrate(info, row);
            const keys = Object.keys(bound);
            const sql =
                `INSERT INTO ${quoteIdent(name)} (${keys.map(quoteIdent).join(", ")}) ` +
                `VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) ` +
                `RETURNING *`;
            const result = await pool.query(
                sql,
                keys.map((k) => bound[k])
            );
            return hydrate(info, result.rows[0]);
        },

        async update(id, patch) {
            const info = await describe(name);
            const current = await api.require(id);
            const next = { ...current, ...patch, [camel(info.pk)]: id };
            const bound = dehydrate(info, next);
            const keys = Object.keys(bound).filter((k) => k !== info.pk);
            const sql =
                `UPDATE ${quoteIdent(name)} SET ${keys
                    .map((k, i) => `${quoteIdent(k)} = $${i + 1}`)
                    .join(", ")} ` +
                `WHERE ${quoteIdent(info.pk)} = $${keys.length + 1} ` +
                `RETURNING *`;
            const result = await pool.query(
                sql,
                [...keys.map((k) => bound[k]), id]
            );
            if (!result.rows[0]) throw notFound("Not found");
            return hydrate(info, result.rows[0]);
        },

        async delete(id) {
            const info = await describe(name);
            const result = await pool.query(
                `DELETE FROM ${quoteIdent(name)} WHERE ${quoteIdent(info.pk)} = $1 RETURNING ${quoteIdent(info.pk)}`,
                [id]
            );
            return result.rows.length > 0;
        },

        async deleteWhere(where, params = []) {
            const { clause } = buildWhere(where, params);
            const info = await describe(name);
            const result = await pool.query(
                `DELETE FROM ${quoteIdent(name)}${clause} RETURNING ${quoteIdent(info.pk)}`,
                params
            );
            return result.rows.length;
        },

        /** Escape hatch for aggregate/report SQL — `?` params, camelCase columns. */
        async sql(query, params = []) {
            const t = translate(query);
            const result = await pool.query(t.sql, params);
            return result.rows;
        },
    };

    return api;
};

export default table;
