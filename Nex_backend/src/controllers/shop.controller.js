import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";

import { addAudit, body, query, requireVendor } from "../middleware/context.js";

import { badRequest, conflict, forbidden, notFound, unauthorized } from "../errors/api.errors.js";

import { futureIn, nowISO, paginate, slugifyString } from "../utils/http.js";

import { computeTotals, round2 } from "../utils/money.js";

import { comparePassword, hashPassword } from "../utils/password.js";

import {
    SHOP_CATEGORIES,
    SHOP_STATUS_LABELS,
    advanceShopOrder,
    currentShopper,
    findOrCreateShopCustomer,
    nextShopOrderNumber,
    productAvailable,
    publishedProducts,
    publishedVendors,
    requireShopper,
    sanitizeShopper,
    shopCategoryFacet,
    shopOrderShape,
    shopProductShape,
    shopTokens,
    vendorShape,
} from "../middleware/shopContext.js";

/*
|--------------------------------------------------------------------
| Storefront handlers — port of the reference backend's shop.routes.ts
| (mock server.js lines 2517-3540). Every success response is wrapped
| in the { success, data } envelope; `data` is exactly what the
| reference returned. Anything that touches the database is async, so
| `table()`, the shopContext helpers and the context helpers are all
| awaited here.
|--------------------------------------------------------------------
*/

/* ---------- home ---------- */

export const shopHome = asyncHandler(async (_req, res) => {
    const published = await publishedProducts();
    const vendors = await publishedVendors();
    const byDiscount = await Promise.all(
        published
            .filter((p) => p.isDeal && p.compareAtPrice)
            .sort(
                (a, b) =>
                    (b.compareAtPrice - b.sellingPrice) / (b.compareAtPrice || 1) -
                    (a.compareAtPrice - a.sellingPrice) / (a.compareAtPrice || 1)
            )
            .slice(0, 8)
            .map((p) => shopProductShape(p))
    );
    const featured = await Promise.all(
        published
            .filter((p) => p.featured)
            .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
            .slice(0, 12)
            .map((p) => shopProductShape(p))
    );
    const bestSellers = await Promise.all(
        [...published]
            .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
            .slice(0, 10)
            .map((p) => shopProductShape(p))
    );
    const newArrivals = await Promise.all(
        [...published]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 8)
            .map((p) => shopProductShape(p))
    );
    const topRated = await Promise.all(
        [...published]
            .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
            .slice(0, 8)
            .map((p) => shopProductShape(p))
    );
    const brandSales = {};
    published.forEach((p) => {
        const key = p.brand || "Generic";
        brandSales[key] = (brandSales[key] || 0) + (p.soldCount || 0);
    });
    const brands = Object.entries(brandSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, sold]) => ({ name, sold }));
    const flashEndsAt = new Date(Date.now() + 18 * 3600000).toISOString();

    return res.json({
        success: true,
        data: {
            stats: {
                vendors: vendors.length,
                products: published.length,
                orders: (await table("shop_orders").count()) + 1240,
                cities: [...new Set((await table("vendors").all()).map((v) => v.city))].length,
            },
            categories: await shopCategoryFacet(),
            flashSale: { endsAt: flashEndsAt, items: byDiscount },
            featured: featured.length ? featured : bestSellers,
            bestSellers,
            newArrivals,
            topRated,
            topVendors: await Promise.all(
                vendors
                    .sort(
                        (a, b) =>
                            (b.store?.rating || 0) - (a.store?.rating || 0) ||
                            (b.store?.productCount || 0) - (a.store?.productCount || 0)
                    )
                    .slice(0, 8)
                    .map((v) => vendorShape(v))
            ),
            brands,
        },
    });
});

/* ---------- categories ---------- */

export const shopCategories = asyncHandler(async (_req, res) => {
    return res.json({ success: true, data: await shopCategoryFacet() });
});

/* ---------- deals ---------- */

export const shopDeals = asyncHandler(async (_req, res) => {
    const items = await Promise.all(
        (await publishedProducts())
            .filter((p) => p.isDeal)
            .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
            .slice(0, 20)
            .map((p) => shopProductShape(p))
    );
    const ends = (await publishedProducts())
        .filter((p) => p.isDeal && p.dealEndsAt)
        .map((p) => new Date(p.dealEndsAt).getTime());

    return res.json({
        success: true,
        data: {
            endsAt: ends.length
                ? new Date(Math.max(...ends)).toISOString()
                : new Date(Date.now() + 24 * 3600000).toISOString(),
            items,
        },
    });
});

/* ---------- vendors ---------- */

export const shopVendors = asyncHandler(async (req, res) => {
    const q = String(query(req).q || "").trim().toLowerCase();
    let vendors = await Promise.all((await publishedVendors()).map((v) => vendorShape(v)));
    if (q) {
        vendors = vendors.filter(
            (v) =>
                v.company.toLowerCase().includes(q) ||
                v.city.toLowerCase().includes(q) ||
                v.tagline.toLowerCase().includes(q) ||
                v.industry.toLowerCase().includes(q)
        );
    }
    if (query(req).city) vendors = vendors.filter((v) => v.city === query(req).city);
    const sort = query(req).sort || "rating";
    const dir = query(req).sortDir === "ASC" ? 1 : -1;
    vendors.sort((a, b) => {
        if (sort === "newest") return (new Date(b.joined).getTime() - new Date(a.joined).getTime()) * dir;
        if (sort === "popular" || sort === "products") return (a.productCount - b.productCount) * dir;
        return (a.rating - b.rating) * dir || a.productCount - b.productCount;
    });

    return res.json({ success: true, data: paginate(vendors, query(req)) });
});

export const shopVendorStore = asyncHandler(async (req, res) => {
    const vendor = (await publishedVendors()).find(
        (v) => v.store?.slug === req.params.slug || v.id === req.params.slug
    );
    if (!vendor) throw notFound("Store not found");
    const products = (await publishedProducts()).filter((p) => p.vendorId === vendor.id);
    const catCounts = {};
    products.forEach((p) => {
        const key = p.shopCategory || "electronics";
        catCounts[key] = (catCounts[key] || 0) + 1;
    });

    return res.json({
        success: true,
        data: {
            vendor: await vendorShape(vendor),
            categories: SHOP_CATEGORIES.filter((c) => catCounts[c.slug]).map((c) => ({
                ...c,
                productCount: catCounts[c.slug],
            })),
            featuredProducts: await Promise.all(
                products
                    .filter((p) => p.featured)
                    .concat(products.filter((p) => !p.featured))
                    .slice(0, 6)
                    .map((p) => shopProductShape(p))
            ),
            stats: {
                productCount: products.length,
                rating: vendor.store?.rating || 0,
                reviewCount: vendor.store?.reviewCount || 0,
                followers: vendor.store?.followers || 0,
                responseMins: vendor.store?.responseMins || 0,
                joined: vendor.store?.joined || vendor.createdAt,
                pickupPoints: vendor.store?.pickupPoints || [],
                contactPhone: vendor.store?.contactPhone || vendor.phone,
                description: vendor.store?.description || "",
                tagline: vendor.store?.tagline || "",
            },
        },
    });
});

/* ---------- products (search / filter / sort / paginate) ---------- */

export const shopProducts = asyncHandler(async (req, res) => {
    const q = String(query(req).q || "").trim().toLowerCase();
    let items = await publishedProducts();
    if (q) {
        items = items.filter((p) =>
            [p.name, p.brand, p.sku, p.shortDescription, p.description]
                .filter(Boolean)
                .some((t) => String(t).toLowerCase().includes(q))
        );
    }
    if (query(req).category) {
        items = items.filter((p) => (p.shopCategory || "electronics") === query(req).category);
    }
    if (query(req).vendorSlug) {
        const vendor = (await table("vendors").all()).find(
            (v) => v.store?.slug === query(req).vendorSlug || v.id === query(req).vendorSlug
        );
        items = vendor ? items.filter((p) => p.vendorId === vendor.id) : [];
    }
    if (query(req).minPrice) items = items.filter((p) => p.sellingPrice >= Number(query(req).minPrice));
    if (query(req).maxPrice) items = items.filter((p) => p.sellingPrice <= Number(query(req).maxPrice));
    if (query(req).rating) items = items.filter((p) => (p.rating || 0) >= Number(query(req).rating));
    if (query(req).brand) items = items.filter((p) => (p.brand || "Generic") === query(req).brand);
    if (query(req).inStock === "true") {
        /* productAvailable is async — resolve availability once, then filter */
        const availability = new Map();
        for (const p of items) availability.set(p.id, await productAvailable(p.id));
        items = items.filter((p) => availability.get(p.id) > 0);
    }
    if (query(req).deal === "true") items = items.filter((p) => p.isDeal);
    if (query(req).featured === "true") items = items.filter((p) => p.featured);

    /* facets computed on the filtered set */
    const brandSet = new Set(items.map((p) => p.brand || "Generic"));
    const catCounts = {};
    items.forEach((p) => {
        const key = p.shopCategory || "electronics";
        catCounts[key] = (catCounts[key] || 0) + 1;
    });
    const prices = items.map((p) => p.sellingPrice);
    const priceRange = prices.length
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : { min: 0, max: 0 };

    const sort = query(req).sort || "popular";
    const sorted = [...items];
    if (sort === "price_asc") sorted.sort((a, b) => a.sellingPrice - b.sellingPrice);
    else if (sort === "price_desc") sorted.sort((a, b) => b.sellingPrice - a.sellingPrice);
    else if (sort === "rating") {
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (sort === "newest") {
        sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sort === "relevance") sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    else {
        sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0) || (b.rating || 0) - (a.rating || 0));
    }

    const result = paginate(sorted, query(req));

    return res.json({
        success: true,
        data: {
            ...result,
            items: await Promise.all(result.items.map((p) => shopProductShape(p))),
            brands: [...brandSet].sort(),
            categoryCounts: catCounts,
            priceRange,
            sort,
        },
    });
});

export const shopProductDetail = asyncHandler(async (req, res) => {
    const key = req.params.idOrSlug;
    const p = (await table("products").all()).find((x) => x.isPublished && (x.id === key || x.slug === key));
    if (!p) throw notFound("Product not found");
    const reviews = await table("reviews").all("productId = ?", [p.id], { order: "createdAt DESC" });
    const detail = await shopProductShape(p, { detail: true });
    detail.reviewSummary = {
        count: reviews.length,
        avg: reviews.length
            ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10
            : p.rating || 0,
        distribution: [5, 4, 3, 2, 1].map((stars) => ({
            stars,
            count: reviews.filter((r) => r.rating === stars).length,
        })),
    };

    return res.json({ success: true, data: detail });
});

/* ---------- reviews ---------- */

export const listProductReviews = asyncHandler(async (req, res) => {
    const p = (await table("products").all()).find(
        (x) => x.id === req.params.productId || x.slug === req.params.productId
    );
    if (!p) throw notFound("Product not found");
    const reviews = await table("reviews").all("productId = ?", [p.id], { order: "createdAt DESC" });
    const page = Math.max(1, Number(query(req).page) || 1);
    const perPage = Math.max(1, Number(query(req).perPage) || 6);
    const start = (page - 1) * perPage;
    const avg = reviews.length
        ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    return res.json({
        success: true,
        data: {
            items: reviews.slice(start, start + perPage),
            total: reviews.length,
            page,
            perPage,
            totalPages: Math.max(1, Math.ceil(reviews.length / perPage)),
            avg,
            distribution: [5, 4, 3, 2, 1].map((stars) => ({
                stars,
                count: reviews.filter((r) => r.rating === stars).length,
            })),
        },
    });
});

export const createProductReview = asyncHandler(async (req, res) => {
    const shopper = await requireShopper(req);
    const p = (await table("products").all()).find(
        (x) => x.id === req.params.productId || x.slug === req.params.productId
    );
    if (!p) throw notFound("Product not found");
    const { rating, title, comment } = body(req);
    const stars = Math.min(5, Math.max(1, Number(rating) || 0));
    if (!stars) throw badRequest("A star rating is required");
    if (!comment || String(comment).trim().length < 5) throw badRequest("Please write a short review");

    const hasBought = (await table("shop_orders").all()).some(
        (o) =>
            (o.shopperId === shopper.id || o.email?.toLowerCase() === shopper.email?.toLowerCase()) &&
            (o.items || []).some((i) => i.productId === p.id) &&
            ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(o.status)
    );
    const review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: p.id,
        shopperId: shopper.id,
        shopperName: shopper.name,
        rating: stars,
        title: String(title || "").trim() || `${stars}\u2605 review`,
        comment: String(comment).trim(),
        verified: hasBought,
        helpful: 0,
        createdAt: nowISO(),
    };
    await table("reviews").insert(review);
    const reviewCount = (p.reviewCount || 0) + 1;
    const newRating = (Math.round(((p.rating || stars) * (reviewCount - 1) + stars) * 10) / 10) / reviewCount || stars;
    await table("products").update(p.id, { reviewCount, rating: newRating });

    return res.json({ success: true, data: review });
});

/* ---------- search suggestions ---------- */

export const searchSuggest = asyncHandler(async (req, res) => {
    const q = String(query(req).q || "").trim().toLowerCase();
    if (!q) {
        return res.json({ success: true, data: { products: [], categories: [], vendors: [] } });
    }
    const products = await Promise.all(
        (await publishedProducts())
            .filter((p) => [p.name, p.brand, p.sku].filter(Boolean).some((t) => String(t).toLowerCase().includes(q)))
            .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
            .slice(0, 6)
            .map((p) => shopProductShape(p))
    );
    const categories = (await shopCategoryFacet()).filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4);
    const vendors = await Promise.all(
        (await publishedVendors())
            .filter(
                (v) =>
                    v.company.toLowerCase().includes(q) || (v.store?.tagline || "").toLowerCase().includes(q)
            )
            .slice(0, 3)
            .map((v) => vendorShape(v))
    );

    return res.json({ success: true, data: { products, categories, vendors } });
});

/* ---------- shopper auth ---------- */

export const registerShopper = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = body(req);
    if (!name || !email || !password) throw badRequest("Name, email and password are required");
    if (String(password).length < 8) throw badRequest("Password must be at least 8 characters");
    const exists = await table("shoppers").find("LOWER(email) = ?", [String(email).toLowerCase()]);
    if (exists) throw conflict("An account with this email already exists");
    const shopper = {
        id: `shp-${Date.now().toString(36)}`,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone || "",
        /* the mock stored plaintext; the backend always keeps a bcrypt hash */
        passwordHash: await hashPassword(String(password)),
        createdAt: nowISO(),
        addresses: [],
    };
    const inserted = await table("shoppers").insert(shopper);

    return res.json({ success: true, data: { shopper: sanitizeShopper(inserted), ...shopTokens(inserted) } });
});

export const loginShopper = asyncHandler(async (req, res) => {
    const { email, password } = body(req);
    if (!email || !password) throw badRequest("Email and password are required");
    const shopper = await table("shoppers").find("LOWER(email) = ?", [String(email).toLowerCase()]);
    if (!shopper || !(await comparePassword(String(password), String(shopper.passwordHash || "")))) {
        throw unauthorized("Invalid email or password");
    }

    return res.json({ success: true, data: { shopper: sanitizeShopper(shopper), ...shopTokens(shopper) } });
});

export const shopMe = asyncHandler(async (req, res) => {
    return res.json({ success: true, data: sanitizeShopper(await requireShopper(req)) });
});

/* ---------- addresses ---------- */

export const listAddresses = asyncHandler(async (req, res) => {
    const shopper = await requireShopper(req);

    return res.json({ success: true, data: shopper.addresses });
});

export const addAddress = asyncHandler(async (req, res) => {
    const shopper = await requireShopper(req);
    const b = body(req);
    if (!b.line || !b.city || !b.state) throw badRequest("Street, city and state are required");
    const address = {
        id: `adr-${Date.now().toString(36)}`,
        label: b.label || "Home",
        name: b.name || shopper.name,
        phone: b.phone || shopper.phone || "",
        line: b.line,
        city: b.city,
        state: b.state,
        zip: b.zip || "",
    };
    const addresses = [...(shopper.addresses || []), address];
    await table("shoppers").update(shopper.id, { addresses });

    return res.json({ success: true, data: addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
    const shopper = await requireShopper(req);
    const addresses = [...(shopper.addresses || [])];
    const idx = addresses.findIndex((a) => a.id === req.params.addressId);
    if (idx === -1) throw notFound("Address not found");
    addresses.splice(idx, 1);
    await table("shoppers").update(shopper.id, { addresses });

    return res.json({ success: true, data: addresses });
});

/* ---------- shop orders ---------- */

export const lookupOrder = asyncHandler(async (req, res) => {
    const number = String(query(req).number || "").trim().toUpperCase();
    const email = String(query(req).email || "").trim().toLowerCase();
    if (!number || !email) throw badRequest("Order number and email are required");
    const order = (await table("shop_orders").all()).find(
        (o) => String(o.number || "").toUpperCase() === number && (o.email || "").toLowerCase() === email
    );
    if (!order) throw notFound("No order matches that number and email");

    return res.json({ success: true, data: shopOrderShape(order) });
});

export const listOrders = asyncHandler(async (req, res) => {
    const shopper = await requireShopper(req);
    const orders = await table("shop_orders").all("shopperId = ?", [shopper.id], { order: "createdAt DESC" });
    const page = Math.max(1, Number(query(req).page) || 1);
    const perPage = Math.max(1, Number(query(req).perPage) || 10);
    const start = (page - 1) * perPage;

    return res.json({
        success: true,
        data: {
            items: orders.slice(start, start + perPage).map((o) => shopOrderShape(o)),
            total: orders.length,
            page,
            perPage,
            totalPages: Math.max(1, Math.ceil(orders.length / perPage)),
        },
    });
});

export const getOrder = asyncHandler(async (req, res) => {
    const shopper = await requireShopper(req);
    const o = (await table("shop_orders").all()).find(
        (x) => x.id === req.params.orderId || x.number === req.params.orderId
    );
    if (!o) throw notFound("Order not found");
    if (o.shopperId && o.shopperId !== shopper.id) throw forbidden("This order belongs to another account");
    await advanceShopOrder(o);

    return res.json({ success: true, data: shopOrderShape(o) });
});

export const createOrder = asyncHandler(async (req, res) => {
    const shopper = await currentShopper(req);
    const b = body(req);

    const email = String(b.email || "").trim().toLowerCase();
    const name = String(b.name || "").trim();
    const phone = String(b.phone || "").trim();
    if (!email || !name) throw badRequest("Contact details (name and email) are required");
    if (!b.address?.line || !b.address?.city || !b.address?.state) {
        throw badRequest("Delivery address is incomplete");
    }
    if (!Array.isArray(b.items) || !b.items.length) throw badRequest("Your cart is empty");

    /* resolve + price every line server-side (never trust client prices) */
    const resolved = [];
    for (const it of b.items) {
        const p = (await table("products").all()).find(
            (x) => x.id === it.productId && x.isPublished && x.type !== "SERVICE"
        );
        if (!p) throw badRequest("One or more products in your cart are no longer available");
        const available = await productAvailable(p.id);
        const qty = Math.max(1, Math.min(50, Math.round(Number(it.qty) || 0)));
        if (qty > available) throw conflict(`Insufficient stock for ${p.name} (only ${available} left)`);
        let unitPrice = p.sellingPrice;
        const variantParts = [];
        for (const sel of it.variants || []) {
            const variant = (p.variants || []).find((v) => v.name === sel.name);
            const opt = variant?.options?.find((o) => o.label === sel.value);
            if (!opt) throw badRequest(`Invalid ${sel.name} option for ${p.name}`);
            unitPrice += Number(opt.priceDelta) || 0;
            variantParts.push(`${variant.name}: ${opt.label}`);
        }
        resolved.push({ p, qty, unitPrice, variantSummary: variantParts.join(" \u00b7 ") });
    }

    const subtotal = round2(resolved.reduce((n, r) => n + r.qty * r.unitPrice, 0));
    const deliveryMethod = ["STANDARD", "EXPRESS", "PICKUP"].includes(b.deliveryMethod)
        ? b.deliveryMethod
        : "STANDARD";
    let deliveryFee = 0;
    if (deliveryMethod === "EXPRESS") deliveryFee = subtotal >= 150000 ? 2500 : 4500;
    else if (deliveryMethod === "STANDARD") deliveryFee = subtotal >= 50000 ? 0 : 2500;
    const total = round2(subtotal + deliveryFee);

    const paymentMethod = ["CARD", "BANK_TRANSFER", "PAY_ON_DELIVERY"].includes(b.paymentMethod)
        ? b.paymentMethod
        : "PAY_ON_DELIVERY";
    const paid = paymentMethod !== "PAY_ON_DELIVERY";
    const paymentStatus = paid ? "PAID" : "PENDING";

    /* group by vendor → ERP sales orders with stock reserved */
    const erpOrders = [];
    const orderItems = [];
    const groups = {};
    for (const r of resolved) {
        const vendor = await table("vendors").get(r.p.vendorId);
        if (!groups[vendor.id]) groups[vendor.id] = { vendor, lines: [] };
        groups[vendor.id].lines.push(r);
        const product = await vendorShape(vendor);
        orderItems.push({
            productId: r.p.id,
            slug: r.p.slug,
            name: r.p.name,
            sku: r.p.sku,
            brand: r.p.brand || "",
            vendorId: vendor.id,
            vendorName: vendor.company,
            vendorSlug: product.slug,
            imageSeed: r.p.imageSeed || r.p.id,
            unitPrice: r.unitPrice,
            compareAtPrice: r.p.compareAtPrice || null,
            qty: r.qty,
            variantSummary: r.variantSummary || null,
            lineTotal: round2(r.qty * r.unitPrice),
        });
    }

    const placedAt = nowISO();
    const buyerForCustomer = { name, email, phone };

    for (const g of Object.values(groups)) {
        const customer = await findOrCreateShopCustomer(g.vendor, buyerForCustomer);
        const lines = g.lines.map((r) => ({
            id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productId: r.p.id,
            quantity: r.qty,
            price: r.unitPrice,
            taxRate: 0, // storefront prices are VAT-inclusive
        }));
        const lineTotal = round2(lines.reduce((n, l) => n + l.quantity * l.price, 0));
        const erpOrder = {
            id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            number: `SO-${100000 + (await table("orders").count("vendorId = ?", [g.vendor.id])) + 1}`,
            vendorId: g.vendor.id,
            customerId: customer.id,
            customerName: customer.company || `${customer.firstName} ${customer.lastName}`,
            quoteId: null,
            lines,
            status: "RESERVED",
            subtotal: lineTotal,
            discount: 0,
            taxable: lineTotal,
            tax: 0,
            total: lineTotal,
            taxRate: 0,
            discountType: "FIXED",
            discountValue: 0,
            createdAt: placedAt,
            orderedAt: placedAt,
            expectedDelivery: futureIn(7, 3),
            issuedBy: shopper ? shopper.id : "guest",
            payments: [],
            shopOrderId: null, // set after shop order number is known
            activity: [
                {
                    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    type: "ORDER_CREATED",
                    title: "Marketplace order received",
                    at: placedAt,
                    by: name,
                },
                {
                    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    type: "ORDER_STATUS",
                    title: "Order status \u2192 CONFIRMED",
                    at: placedAt,
                    by: "System",
                },
                {
                    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    type: "STOCK_RESERVED",
                    title: "Inventory reserved for order",
                    at: placedAt,
                    by: "System",
                },
            ],
        };

        /* reserve stock */
        for (const l of lines) {
            let qty = l.quantity;
            const stockRows = await table("stock").all("productId = ? AND vendorId = ?", [
                l.productId,
                g.vendor.id,
            ]);
            for (const row of stockRows) {
                const take = Math.min(row.available, qty);
                if (take > 0) {
                    await table("stock").update(row.id, {
                        available: row.available - take,
                        reserved: row.reserved + take,
                    });
                    qty -= take;
                }
            }
        }

        /* invoice + payment for paid checkouts */
        if (paid) {
            const invNum = 10001 + (await table("invoices").count("vendorId = ?", [g.vendor.id]));
            const invoice = {
                id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                number: `INV-${String(invNum)}`,
                vendorId: g.vendor.id,
                customerId: customer.id,
                customerName: customer.company || `${customer.firstName} ${customer.lastName}`,
                orderId: erpOrder.id,
                lines: lines.map((l) => ({ ...l })),
                discountType: "FIXED",
                discountValue: 0,
                taxRate: 0,
                status: "PAID",
                dueDate: futureIn(15, 7),
                createdAt: placedAt,
                issuedAt: placedAt,
                issuedBy: "system",
                paymentTerms: "NET15",
                amountPaid: lineTotal,
                payments: [],
                activity: [
                    {
                        id: `act-${Date.now()}`,
                        type: "INVOICE_CREATED",
                        title: "Invoice created from marketplace order",
                        at: placedAt,
                        by: "System",
                    },
                ],
            };
            Object.assign(invoice, computeTotals(invoice));
            await table("invoices").insert(invoice);

            const pay = {
                id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                number: `PAY-${String(100000 + (await table("payments").count()) + 1)}`,
                vendorId: g.vendor.id,
                customerId: customer.id,
                customerName: invoice.customerName,
                invoiceId: invoice.id,
                invoiceNumber: invoice.number,
                amount: invoice.total,
                method: paymentMethod,
                reference: b.payment?.reference || `MKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                status: "PAID",
                paidAt: placedAt,
                receivedBy: "system",
                createdAt: placedAt,
                note: "Marketplace checkout",
            };
            await table("payments").insert(pay);
            invoice.payments.push(pay);
            invoice.activity.unshift({
                id: `act-${Date.now()}`,
                type: "PAYMENT_RECEIVED",
                title: `Payment received \u20a6${Number(pay.amount).toLocaleString("en-NG")}`,
                at: placedAt,
                by: "System",
            });
            await table("invoices").update(invoice.id, {
                payments: invoice.payments,
                activity: invoice.activity,
            });
            erpOrder.payments.push(pay);
        }

        customer.totalPurchases = round2((customer.totalPurchases || 0) + lineTotal);
        if (paid) {
            customer.totalPaid = round2((customer.totalPaid || 0) + lineTotal);
        }
        customer.outstanding = round2((customer.totalPurchases || 0) - (customer.totalPaid || 0));
        customer.activity.unshift({
            id: `act-${Date.now()}`,
            type: "CUSTOMER_ORDERED",
            title: "Placed a marketplace order",
            at: placedAt,
            by: name,
        });
        await table("customers").update(customer.id, {
            totalPurchases: customer.totalPurchases,
            totalPaid: customer.totalPaid,
            outstanding: customer.outstanding,
            activity: customer.activity,
        });

        await table("orders").insert(erpOrder);
        erpOrders.push({
            vendorId: g.vendor.id,
            vendorName: g.vendor.company,
            orderId: erpOrder.id,
            number: erpOrder.number,
        });
    }

    const number = await nextShopOrderNumber();
    // link ERP orders to the shop order number
    for (const eo of erpOrders) {
        await table("orders").update(String(eo.orderId), { shopOrderId: number });
    }

    const timeline = [{ key: "PLACED", label: SHOP_STATUS_LABELS.PLACED, at: placedAt }];
    if (paid) {
        timeline.push({ key: "CONFIRMED", label: SHOP_STATUS_LABELS.CONFIRMED, at: placedAt });
        timeline.push({ key: "PROCESSING", label: SHOP_STATUS_LABELS.PROCESSING, at: placedAt });
    }

    const estDays = deliveryMethod === "EXPRESS" ? 2 : deliveryMethod === "PICKUP" ? 1 : 5;
    const shopOrder = {
        id: `so-${number}-${Math.random().toString(36).slice(2, 6)}`,
        number,
        shopperId: shopper ? shopper.id : null,
        email,
        name,
        phone,
        items: orderItems,
        address: {
            label: b.address.label || "Home",
            name: b.address.name || name,
            phone: b.address.phone || phone,
            line: b.address.line,
            city: b.address.city,
            state: b.address.state,
            zip: b.address.zip || "",
        },
        deliveryMethod,
        deliveryFee,
        subtotal,
        discount: 0,
        total,
        paymentMethod,
        paymentStatus,
        paymentReference: b.payment?.reference || null,
        cardLast4: b.payment?.last4 || null,
        status: paid ? "PROCESSING" : "PLACED",
        timeline,
        erpOrders,
        note: b.note ? String(b.note).slice(0, 400) : null,
        createdAt: placedAt,
        estimatedDelivery: new Date(Date.now() + estDays * 86400000).toISOString(),
        channel: "web",
        autoAdvance: true,
    };
    await table("shop_orders").insert(shopOrder);

    if (shopper && b.saveAddress && b.address) {
        const addresses = [...(shopper.addresses || [])];
        const exists = addresses.some(
            (a) =>
                a.line?.toLowerCase() === String(b.address.line).toLowerCase() &&
                a.city?.toLowerCase() === String(b.address.city).toLowerCase()
        );
        if (!exists) {
            addresses.push({
                id: `adr-${Date.now().toString(36)}`,
                label: b.address.label || "Home",
                name: b.address.name || shopper.name,
                phone: b.address.phone || shopper.phone || "",
                line: b.address.line,
                city: b.address.city,
                state: b.address.state,
                zip: b.address.zip || "",
            });
            await table("shoppers").update(shopper.id, { addresses });
        }
    }

    return res.json({ success: true, data: shopOrderShape(shopOrder) });
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const shopper = await requireShopper(req);
    const o = (await table("shop_orders").all()).find(
        (x) => x.id === req.params.orderId || x.number === req.params.orderId
    );
    if (!o) throw notFound("Order not found");
    if (o.shopperId && o.shopperId !== shopper.id) throw forbidden("This order belongs to another account");
    if (!["PLACED", "CONFIRMED", "PROCESSING"].includes(o.status)) {
        throw badRequest("This order can no longer be cancelled");
    }
    const timeline = o.timeline || [];
    o.status = "CANCELLED";
    o.cancelledAt = nowISO();
    timeline.push({ key: "CANCELLED", label: "Cancelled", at: nowISO() });
    if (o.paymentStatus === "PAID") o.paymentStatus = "REFUNDED";

    for (const eo of o.erpOrders) {
        const erp = await table("orders").get(eo.orderId);
        if (erp && ["DRAFT", "PENDING", "CONFIRMED", "RESERVED"].includes(erp.status)) {
            const activity = erp.activity || [];
            erp.status = "CANCELLED";
            activity.unshift({
                id: `act-${Date.now()}`,
                type: "ORDER_STATUS",
                title: `Order status \u2192 CANCELLED (shopper ${o.number})`,
                at: nowISO(),
                by: shopper.name,
            });
            for (const l of erp.lines) {
                const stockRows = await table("stock").all("productId = ? AND vendorId = ?", [
                    l.productId,
                    erp.vendorId,
                ]);
                for (const row of stockRows) {
                    const release = Math.min(row.reserved, l.quantity);
                    await table("stock").update(row.id, {
                        reserved: row.reserved - release,
                        available: row.available + release,
                    });
                }
            }
            const inv = await table("invoices").find("orderId = ?", [erp.id]);
            if (inv) {
                const invPatch = { status: "CANCELLED" };
                if (o.paymentStatus === "REFUNDED") {
                    invPatch.amountPaid = 0;
                    invPatch.payments = [];
                }
                await table("invoices").update(inv.id, invPatch);
            }
            await table("orders").update(erp.id, { status: "CANCELLED", activity });
        }
    }

    await table("shop_orders").update(o.id, {
        status: "CANCELLED",
        cancelledAt: o.cancelledAt,
        paymentStatus: o.paymentStatus,
        timeline,
    });

    return res.json({ success: true, data: shopOrderShape(o) });
});

/* ---------- ERP: storefront settings & stats ---------- */

export const getStorefront = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);

    return res.json({
        success: true,
        data: {
            ...vendor.store,
            company: vendor.company,
            industry: vendor.industry,
            city: vendor.city,
            phone: vendor.phone,
            email: vendor.email,
            productCount: await table("products").count("vendorId = ? AND isPublished = TRUE", [vendor.id]),
            publicUrl: `/shop/vendors/${vendor.store?.slug}`,
        },
    });
});

export const updateStorefront = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const b = req.body || {};
    const store = vendor.store || {};
    const allowed = ["tagline", "description", "contactPhone", "pickupPoints", "responseMins", "published"];
    allowed.forEach((k) => {
        if (b?.[k] !== undefined) store[k] = b[k];
    });
    if (b?.slug) store.slug = slugifyString(b.slug);
    await table("vendors").update(vendor.id, { store });
    await addAudit(req, "updated", "storefront", vendor.id, "Updated storefront settings", vendor.id);

    return res.json({
        success: true,
        data: {
            ...store,
            company: vendor.company,
            industry: vendor.industry,
            city: vendor.city,
            phone: vendor.phone,
            email: vendor.email,
            productCount: await table("products").count("vendorId = ? AND isPublished = TRUE", [vendor.id]),
            publicUrl: `/shop/vendors/${store.slug}`,
        },
    });
});

export const getStorefrontStats = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const myShopOrders = (await table("shop_orders").all()).filter(
        (o) => (o.erpOrders || []).some((e) => e.vendorId === vendor.id)
    );
    const active = myShopOrders.filter((o) => o.status !== "CANCELLED");
    const paidOrders = active.filter(
        (o) => o.paymentStatus === "PAID" || (o.paymentStatus === "PENDING" && o.status === "DELIVERED")
    );
    const revenue = round2(
        active.reduce(
            (n, o) =>
                n +
                (o.items || [])
                    .filter((i) => i.vendorId === vendor.id)
                    .reduce((m, i) => m + i.lineTotal, 0),
            0
        )
    );
    const products = await table("products").all("vendorId = ?", [vendor.id]);
    const published = products.filter((p) => p.isPublished);
    const views = await table("shop_views").all("vendorId = ?", [vendor.id]);

    const byDay = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(Date.now() - (6 - i) * 86400000);
        const label = day.toLocaleDateString("en-NG", { weekday: "short" });
        const key = day.toDateString();
        return {
            label,
            views: views.filter((v) => new Date(v.at).toDateString() === key).length,
            orders: active.filter((o) => new Date(o.createdAt).toDateString() === key).length,
        };
    });

    const sales = {};
    active.forEach((o) => {
        (o.items || [])
            .filter((i) => i.vendorId === vendor.id)
            .forEach((i) => {
                if (!sales[i.productId]) {
                    sales[i.productId] = { productId: i.productId, name: i.name, qty: 0, revenue: 0 };
                }
                sales[i.productId].qty += i.qty;
                sales[i.productId].revenue = round2(sales[i.productId].revenue + i.lineTotal);
            });
    });
    const topProducts = Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const avgRating =
        vendor.store?.reviewCount > 0
            ? vendor.store.rating
            : Math.round(
                  (published.reduce((n, p) => n + (p.rating || 0), 0) / (published.length || 1)) * 10
              ) / 10;

    return res.json({
        success: true,
        data: {
            productCount: published.length,
            draftCount: products.filter((p) => !p.isPublished).length,
            orderCount: active.length,
            revenue,
            views: views.length,
            avgRating,
            followerCount: vendor.store?.followers || 0,
            responseMins: vendor.store?.responseMins || 0,
            conversionRate: views.length ? Math.round((active.length / views.length) * 1000) / 10 : 0,
            trend: byDay,
            topProducts,
            lastOrderAt: active[0]?.createdAt || null,
            storeSlug: vendor.store?.slug || "",
        },
    });
});
