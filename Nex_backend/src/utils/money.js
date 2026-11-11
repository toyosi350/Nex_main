/*
|--------------------------------------------------------------------
| Money helpers.
|
| The Nex-IV frontend stores whole Naira (no kobo) in every money field
| and rounds to 2dp in `computeTotals`, so this backend mirrors that
| exactly — converting to integer minor units would make totals differ
| from what the UI already displays. `round2` is kept in one place so
| the rounding used at write time is the only rounding in the system.
|--------------------------------------------------------------------
*/

export function round2(v) {
    return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Port of db.js `computeTotals` — the single source of document totals. */
export function computeTotals(doc) {
    let subtotal = 0;
    const lines = doc.lines || [];
    for (const l of lines) {
        subtotal += Math.round(Number(l.quantity) * Number(l.price) * 100);
    }
    subtotal = Math.round(subtotal) / 100;
    const discount =
        doc.discountType === "PERCENT"
            ? (subtotal * Number(doc.discountValue || 0)) / 100
            : Number(doc.discountValue || 0);
    const taxable = subtotal - discount;
    const taxRate = Number(doc.taxRate || 0);
    return {
        subtotal: round2(subtotal),
        discount: round2(discount),
        taxable: round2(taxable),
        tax: round2((taxable * taxRate) / 100),
        total: round2(taxable + (taxable * taxRate) / 100),
    };
}

/** Line total used by cart/order math. */
export function lineTotal(line) {
    return round2(Number(line.quantity) * Number(line.price));
}

export function formatNgn(v) {
    return `\u20a6${Number(v || 0).toLocaleString("en-NG")}`;
}
