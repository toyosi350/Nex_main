/*
|--------------------------------------------------------------------
| Request-shaped helpers, ported verbatim from the reference backend's
| shared/http.ts, which itself was ported from the frontend's mock
| server. These are behavioural copies, not re-implementations: the
| frontend already depends on their exact semantics (param names,
| defaults, localeCompare sorting) and the two must not drift.
|--------------------------------------------------------------------
*/

/**
 * @param {Record<string, any>} items
 * @param {Record<string, string | undefined>} query
 */
export function paginate(items, query) {
    const page = Math.max(1, Number(query.page) || 1);
    const perPage = Math.max(1, Math.min(200, Number(query.perPage) || 10));
    const total = items.length;
    const totalPages = Math.ceil(total / perPage);
    return {
        items: items.slice((page - 1) * perPage, page * perPage),
        total,
        page,
        perPage,
        totalPages,
    };
}

export function filterBySearch(items, keys, term) {
    const t = String(term || "").trim().toLowerCase();
    if (!t) return items;
    return items.filter((it) => keys.some((k) => String(it[k] ?? "").toLowerCase().includes(t)));
}

/** `?status=A,B` or `?status=A`; `ALL` / absent means no filter. */
export function filterByStatus(items, query) {
    const s = query.status;
    if (!s || s === "ALL") return items;
    const list = String(s).split(",");
    return items.filter((it) => list.includes(it.status));
}

export function sortItems(items, query, defaultKey = "createdAt") {
    const { sortBy, sortDir } = query;
    const key = sortBy || defaultKey;
    const dir = sortDir === "ASC" ? 1 : -1;
    return [...items].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
    });
}

export function nowISO() {
    return new Date().toISOString();
}

export function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function dates(query) {
    if (!query.from && !query.to) return null;
    return {
        from: query.from ? new Date(query.from) : new Date(Date.now() - 730 * 86400000),
        to: query.to ? new Date(query.to) : new Date(),
    };
}

export function inRange(date, from, to) {
    return date >= from && date <= to;
}

export function inMonth(date, ref) {
    return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
}

export function slugifyString(s) {
    return String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        /* storefront URLs are capped at 60 chars — without this a long product
           name would mint a slug the frontend's product page can't resolve */
        .slice(0, 60);
}

export function clone(value) {
    if (value === null || typeof value !== "object") return value;
    return JSON.parse(JSON.stringify(value));
}

/* --- helpers the mock keeps next to its report endpoints (server.js 3541+) --- */

/** Random integer, inclusive — used when generating plausible future dates. */
export function rInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/** ISO timestamp `minDays..maxDays` in the future. */
export function futureIn(minDays, maxDays) {
    return new Date(Date.now() + rInt(minDays, maxDays) * 86400000).toISOString();
}

/** `Jan`, `Feb`, … as Intl renders them for the chart axis. */
export function monthShort(d) {
    return new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d);
}

/** Last `n` calendar months, newest last, mapped through `fn`. */
export function monthSeries(n, fn) {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        out.push(fn(d));
    }
    return out;
}

/** First two words of a company name — chart labels. */
export function shortName(company) {
    return String(company || "").split(" ").slice(0, 2).join(" ");
}

/** Milliseconds-free day difference used by SLA / overdue checks. */
export function daysBetween(a, b) {
    const MS = 86400000;
    return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / MS);
}
