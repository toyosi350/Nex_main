/*
 * Storefront order constants — mirrors Nex_backend's
 * src/middleware/shopContext.js (SHOP_STATUS_FLOW / SHOP_STATUS_LABELS).
 * The order timeline UI depends on these staying in sync.
 */

export const SHOP_STATUS_FLOW = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]

export const SHOP_STATUS_LABELS = {
  PLACED: "Order placed",
  CONFIRMED: "Order confirmed",
  PROCESSING: "Packed & processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
}

export const SHOP_CATEGORIES = [
  { slug: "electronics", name: "Electronics" },
  { slug: "phones-tablets", name: "Phones & Tablets" },
  { slug: "computers", name: "Computers & Laptops" },
  { slug: "fashion", name: "Fashion" },
  { slug: "home-kitchen", name: "Home & Kitchen" },
  { slug: "beauty-health", name: "Beauty & Health" },
  { slug: "groceries", name: "Groceries" },
  { slug: "sports", name: "Sports & Outdoors" },
  { slug: "baby", name: "Baby Products" },
  { slug: "office", name: "Office & School" },
  { slug: "tools", name: "Tools & Hardware" },
  { slug: "automotive", name: "Automotive" },
  { slug: "industrial", name: "Industrial" },
]

export const SHOP_CATEGORY_NAME = Object.fromEntries(
  SHOP_CATEGORIES.map((c) => [c.slug, c.name]),
)

export const PAYMENT_METHOD_LABELS = {
  CARD: "Card payment",
  BANK_TRANSFER: "Bank transfer",
  PAY_ON_DELIVERY: "Pay on delivery",
}

export const DELIVERY_METHOD_LABELS = {
  STANDARD: "Standard delivery",
  EXPRESS: "Express delivery",
  PICKUP: "Store pickup",
}
