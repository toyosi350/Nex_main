import table from "../repositories/table.js";
import { unauthorized } from "../errors/api.errors.js";
import { nowISO } from "../utils/http.js";
import { decodeToken, signShopperToken } from "../utils/jwt.js";
import { productImagesOf } from "../services/enrich.js";

/*
|--------------------------------------------------------------------
| Storefront (shopper-side) helpers — port of the reference backend's
| api/shopContext.ts, which itself ported server.js 2517-2668.
|
| Shoppers are a *separate identity space* from ERP users: tokens are
| minted with `typ: 'shopper'` and the user middleware rejects them,
| so these helpers decode the bearer token themselves and only accept
| it when the claim says it belongs to a storefront session.
|
| Anything that touches the database is async.
|--------------------------------------------------------------------
*/

/* ------------------------------------------------------------------ *
 * Shop constants (frontend src/constants/shop.js, copied verbatim —
 * the storefront filters and status timelines depend on them)
 * ------------------------------------------------------------------ */

export const SHOP_CATEGORIES = [
  { slug: "electronics", name: "Electronics", icon: "Tv" },
  { slug: "phones-tablets", name: "Phones & Tablets", icon: "PhoneIphone" },
  { slug: "computers", name: "Computers & Laptops", icon: "LaptopMac" },
  { slug: "fashion", name: "Fashion", icon: "Checkroom" },
  { slug: "home-kitchen", name: "Home & Kitchen", icon: "Kitchen" },
  { slug: "beauty-health", name: "Beauty & Health", icon: "Spa" },
  { slug: "groceries", name: "Groceries", icon: "LocalGroceryStore" },
  { slug: "sports", name: "Sports & Outdoors", icon: "FitnessCenter" },
  { slug: "baby", name: "Baby Products", icon: "ChildFriendly" },
  { slug: "office", name: "Office & School", icon: "BusinessCenter" },
  { slug: "tools", name: "Tools & Hardware", icon: "Handyman" },
  { slug: "automotive", name: "Automotive", icon: "DirectionsCar" },
  { slug: "industrial", name: "Industrial", icon: "Factory" },
];

export const SHOP_STATUS_FLOW = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const SHOP_STATUS_LABELS = {
  PLACED: "Order placed",
  CONFIRMED: "Order confirmed",
  PROCESSING: "Packed & processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const SHOP_CATEGORY_NAME = Object.fromEntries(
  SHOP_CATEGORIES.map((c) => [c.slug, c.name])
);
export const SHOP_STAGE_GAP_MS = 90000; // mock auto-progress interval for live tracking

/* ------------------------------------------------------------------ *
 * Shopper identity
 * ------------------------------------------------------------------ */

export const bearerFrom = (req) => {
  const header = req.headers.authorization || "";
  return String(header).replace(/^Bearer\s+/i, "");
};

/** 30-day shopper session token (`typ: 'shopper'`). */
export function shopTokens(shopper) {
  return { accessToken: signShopperToken(String(shopper.id)) };
}

/**
 * The mock's shoppers carried a plaintext `password` field; the seed
 * replaced it with a bcrypt hash, so both keys are stripped before any
 * shopper object leaves the API.
 */
export function sanitizeShopper(shopper) {
  const copy = { ...shopper };
  delete copy.password;
  delete copy.passwordHash;
  return copy;
}

/** Decodes a *shopper* session; ERP-user tokens (and junk) yield null. */
export async function currentShopper(req) {
  const claims = decodeToken(bearerFrom(req));
  if (!claims || claims.typ !== "shopper") return null;
  if (!claims.userId) return null;
  return (await table("shoppers").get(claims.userId)) || null;
}

/** Same, but a missing/expired shopper session is a 401. */
export async function requireShopper(req) {
  const shopper = await currentShopper(req);
  if (!shopper) throw unauthorized("Please sign in to continue");
  return shopper;
}

/* ------------------------------------------------------------------ *
 * Catalogue helpers
 * ------------------------------------------------------------------ */

export async function productAvailable(productId) {
  const rows = await table("stock").all("productId = ?", [productId]);
  return rows.reduce((n, s) => n + s.available, 0);
}

export function shopStockStatus(available) {
  if (available <= 0) return "OUT_OF_STOCK";
  if (available <= 5) return "LOW_STOCK";
  return "IN_STOCK";
}

export function daysSince(iso) {
  if (!iso) return 999;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export async function shopProductShape(p, { detail = false } = {}) {
  const vendor = p.vendorId ? await table("vendors").get(p.vendorId) : null;
  const available = await productAvailable(p.id);
  const images = await productImagesOf(p.id);
  const out = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand || "",
    sku: p.sku,
    vendorId: p.vendorId,
    vendorName: vendor?.company,
    vendorSlug: vendor?.store?.slug,
    vendorCity: vendor?.city,
    vendorVerified: !!vendor?.store?.verified,
    category: p.shopCategory || "electronics",
    categoryName: SHOP_CATEGORY_NAME[p.shopCategory] || "Electronics",
    price: p.sellingPrice,
    compareAtPrice: p.compareAtPrice || null,
    discountPct: p.compareAtPrice
      ? Math.round((1 - p.sellingPrice / p.compareAtPrice) * 100)
      : 0,
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
    available,
    stockStatus: shopStockStatus(available),
    imageSeed: p.imageSeed || p.id,
    imageCount: p.imageCount || 1,
    imageUrl: images[0] || null,
    images,
    shortDescription: p.shortDescription || p.description || "",
    freeDelivery: !!p.freeDelivery,
    isDeal: !!p.isDeal,
    dealEndsAt: p.dealEndsAt || null,
    featured: !!p.featured,
    soldCount: p.soldCount || 0,
    isNew: daysSince(p.createdAt) <= 21,
    createdAt: p.createdAt,
  };
  if (detail) {
    out.description = p.description || "";
    out.returnDays = p.returnDays || 7;
    out.weightKg = p.weightKg ?? null;
    out.dimensions = p.dimensions || null;
    out.tags = p.tags || [];
    out.specs = (p.specs || []).length
      ? p.specs
      : [{ label: "Brand", value: p.brand || "Generic" }];
    out.variants = (p.variants || []).map((v) => ({
      name: v.name,
      options: (v.options || []).map((o) => ({
        label: o.label,
        priceDelta: o.priceDelta || 0,
      })),
    }));
    const related = (await table("products").all())
      .filter((x) => x.isPublished && x.id !== p.id && x.shopCategory === out.category)
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 6);
    out.related = await Promise.all(related.map((x) => shopProductShape(x)));
  }
  return out;
}

/** Products a shopper may buy: published and not SERVICE rows. */
export async function publishedProducts() {
  const all = await table("products").all();
  return all.filter((p) => p.isPublished && p.type !== "SERVICE");
}

export async function shopCategoryFacet() {
  const counts = {};
  (await publishedProducts()).forEach((p) => {
    const key = p.shopCategory || "electronics";
    counts[key] = (counts[key] || 0) + 1;
  });
  return SHOP_CATEGORIES.map((c) => ({ ...c, productCount: counts[c.slug] || 0 }));
}

export async function publishedVendors() {
  const all = await table("vendors").all();
  return all.filter((v) => v.store?.published);
}

export async function vendorShape(v) {
  const products = (await publishedProducts()).filter((p) => p.vendorId === v.id);
  return {
    id: v.id,
    slug: v.store?.slug || v.id,
    company: v.company,
    city: v.city,
    industry: v.industry,
    tagline: v.store?.tagline || "",
    description: v.store?.description || "",
    verified: !!v.store?.verified,
    rating: v.store?.rating || 0,
    reviewCount: v.store?.reviewCount || 0,
    followers: v.store?.followers || 0,
    responseMins: v.store?.responseMins || 0,
    joined: v.store?.joined || v.createdAt,
    productCount: products.length,
    categories: [...new Set(products.map((p) => p.shopCategory || "electronics"))],
    status: v.status,
  };
}

/* ------------------------------------------------------------------ *
 * Shop orders
 * ------------------------------------------------------------------ */

/** Steps a live order forward one stage once the 90s mock gap has elapsed. */
export async function advanceShopOrder(o) {
  if (!o.autoAdvance || o.status === "CANCELLED" || o.status === "DELIVERED" || o.status === "RETURNED") return;
  const idx = SHOP_STATUS_FLOW.indexOf(o.status);
  if (idx < 0 || idx >= SHOP_STATUS_FLOW.length - 1) return;
  const timeline = o.timeline || [];
  const last = timeline[timeline.length - 1];
  const lastAt = last ? new Date(last.at).getTime() : new Date(o.createdAt).getTime();
  if (Date.now() - lastAt < SHOP_STAGE_GAP_MS) return;
  const next = SHOP_STATUS_FLOW[idx + 1];
  const patch = {
    status: next,
    timeline: [...timeline, { key: next, label: SHOP_STATUS_LABELS[next], at: nowISO() }],
  };
  if (next === "DELIVERED") patch.deliveredAt = nowISO();
  Object.assign(o, await table("shop_orders").update(o.id, patch));
}

export function shopOrderShape(o) {
  const items = o.items || [];
  return {
    ...o,
    itemCount: items.reduce((n, i) => n + i.qty, 0),
    vendorNames: [...new Set(items.map((i) => i.vendorName))],
  };
}

/** Next storefront order number; the series starts after the mock's seed (10400). */
export async function nextShopOrderNumber() {
  const all = await table("shop_orders").all();
  const nums = all
    .map((o) => Number(String(o.number || "").replace(/^NEX-/, "")) || 0)
    .concat([10400]);
  return `NEX-${Math.max(...nums) + 1}`;
}

/**
 * Marketplace checkouts land as ERP customers under the vendor they buy
 * from. An existing (vendor, email) pair is reused; otherwise a
 * guest-ish customer is created exactly as the mock shaped it.
 */
export async function findOrCreateShopCustomer(vendor, buyer) {
  const email = String(buyer.email || "").toLowerCase();
  const existing = await table("customers").find(
    "vendorId = ? AND LOWER(COALESCE(email, '')) = ?",
    [vendor.id, email]
  );
  if (existing) return existing;
  const parts = String(buyer.name || "").split(/\s+/);
  const customer = {
    id: `cst-${vendor.id}-shop-${(await table("customers").count()) + 1}`,
    vendorId: vendor.id,
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "Shopper",
    company: null,
    email: buyer.email,
    phone: buyer.phone || "",
    address: "",
    creditLimit: 500000,
    paymentTerms: "NET15",
    status: "ACTIVE",
    createdAt: nowISO(),
    totalPurchases: 0,
    totalPaid: 0,
    outstanding: 0,
    notes: [{ text: "Nex-IV marketplace buyer", by: "System", at: nowISO() }],
    activity: [
      {
        id: `act-${Date.now()}`,
        type: "CUSTOMER_CREATED",
        title: "Created from marketplace checkout",
        at: nowISO(),
        by: "System",
      },
    ],
  };
  return await table("customers").insert(customer);
}
