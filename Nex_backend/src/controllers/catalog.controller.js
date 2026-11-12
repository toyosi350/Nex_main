import fs from "fs";
import path from "path";

import asyncHandler from "../middleware/async.middleware.js";

import table from "../repositories/table.js";
import { badRequest, notFound } from "../errors/api.errors.js";
import { sortItems, nowISO } from "../utils/http.js";
import { round2 } from "../utils/money.js";
import { addAudit, body, query, requireVendor, vendorList } from "../middleware/context.js";
import { enrichProduct, productImagesOf } from "../services/enrich.js";
import { UPLOADS_DIR } from "../middleware/upload.middleware.js";

export const listCategories = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const categories = await table("categories").all("vendorId = ?", [vendor.id]);
    return res.json({
        success: true,
        data: await Promise.all(
            categories.map(async (c) => ({
                ...c,
                productCount: await table("products").count("categoryId = ?", [c.id]),
            }))
        ),
    });
});

export const createCategory = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.name) throw badRequest("Category name is required");
    const count = await table("categories").count("vendorId = ?", [vendor.id]);
    const c = {
        id: `cat-${vendor.id}-${count + 1}-${Math.random().toString(36).slice(2, 5)}`,
        vendorId: vendor.id,
        name: b.name,
        code: b.code || `CAT${count + 1}`,
        productCount: 0,
    };
    await table("categories").insert(c);
    return res.json({ success: true, data: c });
});

export const listProducts = asyncHandler(async (req, res) => {
    const result = await vendorList(req, "products", {
        searchKeys: ["name", "sku", "brand"],
        sortDefault: "createdAt",
    });
    return res.json({
        success: true,
        data: {
            ...result,
            items: await Promise.all(result.items.map((p) => enrichProduct(p))),
        },
    });
});

export const getProduct = asyncHandler(async (req, res) => {
    await requireVendor(req, req.params.vendorId);
    const p = await table("products").find("id = ? AND vendorId = ?", [
        req.params.productId,
        req.params.vendorId,
    ]);
    if (!p) throw notFound("Product not found");
    const stockRows = await table("stock").all("productId = ?", [p.id]);
    const movements = [];
    for (const s of stockRows) {
        const warehouse = await table("warehouses").get(s.warehouseId);
        for (const m of s.movements) {
            movements.push({
                ...m,
                warehouse: warehouse?.name,
                productId: p.id,
            });
        }
    }
    return res.json({
        success: true,
        data: {
            ...(await enrichProduct(p)),
            movements: movements.sort(
                (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
            ),
        },
    });
});

export const createProduct = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const b = body(req);
    if (!b.name || !b.sku) throw badRequest("Name and SKU are required");
    const id = `prod-${vendor.id}-${(await table("products").count("vendorId = ?", [vendor.id])) + 1}`;
    const product = {
        id,
        vendorId: vendor.id,
        categoryId: b.categoryId || null,
        type: b.type || "PRODUCT",
        sku: b.sku,
        name: b.name,
        description: b.description || "",
        brand: b.brand || "",
        costPrice: Number(b.costPrice) || 0,
        sellingPrice: Number(b.sellingPrice) || 0,
        taxRate: Number(b.taxRate) || 7.5,
        reorderLevel: Number(b.reorderLevel) || 0,
        unit: b.unit || "pcs",
        status: b.status || "ACTIVE",
        supplierIds: b.supplierIds || [],
        supplierId: b.supplierId || null,
        /* storefront defaults */
        isPublished:
            b.isPublished !== undefined ? !!b.isPublished : (b.status || "ACTIVE") === "ACTIVE",
        slug: b.slug || `${slugifyString(b.name)}-${slugifyString(vendor.company)}`,
        shopCategory: b.shopCategory || null,
        shortDescription: b.shortDescription || "",
        compareAtPrice: b.compareAtPrice ? Number(b.compareAtPrice) : null,
        isDeal: !!b.isDeal,
        dealEndsAt: b.dealEndsAt || null,
        featured: !!b.featured,
        rating: Number(b.rating) || 4.0,
        reviewCount: 0,
        soldCount: 0,
        freeDelivery: !!b.freeDelivery,
        imageSeed: b.imageSeed || `${id}-art`,
        imageCount: 1,
        returnDays: Number(b.returnDays) || 7,
        tags: b.tags || [],
        specs: b.specs || [],
        variants: b.variants || null,
        weightKg: b.weightKg ? Number(b.weightKg) : null,
        dimensions: b.dimensions || null,
    };
    await table("products").insert(product);
    const supplier = b.supplierId ? await table("suppliers").get(b.supplierId) : null;
    if (supplier) {
        const supplierProducts = Array.isArray(supplier.products) ? supplier.products : [];
        supplierProducts.push(id);
        await table("suppliers").update(supplier.id, { products: supplierProducts });
        product.supplierIds.push(supplier.id);
        await table("products").update(id, { supplierIds: product.supplierIds });
    }
    await addAudit(req, "created", "product", id, `Created product ${product.name}`, vendor.id);
    return res.json({ success: true, data: await enrichProduct(product) });
});

export const updateProduct = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const p = await table("products").find("id = ? AND vendorId = ?", [
        req.params.productId,
        vendor.id,
    ]);
    if (!p) throw notFound("Product not found");
    const b = body(req);
    const allowed = ["categoryId", "type", "sku", "name", "description", "brand", "costPrice", "sellingPrice", "taxRate", "reorderLevel", "unit", "status", "shortDescription", "compareAtPrice", "isPublished", "featured", "isDeal", "dealEndsAt", "slug", "shopCategory", "freeDelivery", "returnDays", "imageCount", "tags", "specs", "variants", "weightKg", "dimensions"];
    const patch = {};
    allowed.forEach((k) => {
        if (b?.[k] !== undefined) {
            patch[k] = k.includes("Price") || k === "taxRate" || k === "reorderLevel" || k === "returnDays" || k === "imageCount" || k === "weightKg" ? Number(b[k]) : b[k];
        }
    });
    if (b?.slug) patch.slug = b.slug;
    Object.assign(p, patch);
    await table("products").update(p.id, patch);
    await addAudit(req, "updated", "product", p.id, `Updated product ${p.name}`, vendor.id);
    return res.json({ success: true, data: await enrichProduct(p) });
});

/** Copied verbatim from server.js line 883 (defined inside this range). */
function slugifyString(s) {
    return String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

export const listWarehouses = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const warehouses = await table("warehouses").all("vendorId = ?", [vendor.id]);
    return res.json({
        success: true,
        data: await Promise.all(
            warehouses.map(async (w) => {
                const rows = await table("stock").all("warehouseId = ?", [w.id]);
                return {
                    ...w,
                    stockLines: rows.length,
                    totalUnits: rows.reduce((s, r) => s + r.available, 0),
                    value: round2(
                        rows.reduce((s, r) => s + (r.available + r.incoming) * r.unitCost, 0)
                    ),
                };
            })
        ),
    });
});

export const getWarehouse = asyncHandler(async (req, res) => {
    await requireVendor(req, req.params.vendorId);
    const w = await table("warehouses").find("id = ? AND vendorId = ?", [
        req.params.warehouseId,
        req.params.vendorId,
    ]);
    if (!w) throw notFound("Warehouse not found");
    const rows = await table("stock").all("warehouseId = ?", [w.id]);
    const lines = await Promise.all(
        rows.map(async (r) => {
            const p = await table("products").get(r.productId);
            return {
                ...r,
                product: p ? { id: p.id, name: p.name, sku: p.sku, categoryId: p.categoryId } : null,
            };
        })
    );
    return res.json({
        success: true,
        data: {
            ...w,
            lines: sortItems(lines, query(req), "available").map((l) => l),
            value: round2(
                rows.reduce((s, r) => s + (r.available + r.incoming) * r.unitCost, 0)
            ),
            totalUnits: rows.reduce((s, r) => s + r.available, 0),
        },
    });
});

/* ---------- product images (upload) ---------- */

export const listProductImages = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const p = await table("products").find("id = ? AND vendorId = ?", [
        req.params.productId,
        req.params.vendorId,
    ]);
    if (!p) throw notFound("Product not found");
    const images = await table("product_images").all("productId = ?", [p.id], {
        order: "position, createdAt",
    });
    return res.json({ success: true, data: images });
});

export const addProductImage = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const p = await table("products").find("id = ? AND vendorId = ?", [
        req.params.productId,
        req.params.vendorId,
    ]);
    if (!p) throw notFound("Product not found");
    const files = req.files || [];
    if (!files.length) {
        throw badRequest("Please choose at least one image (JPEG, PNG, WebP, AVIF or GIF)");
    }
    const existing = await table("product_images").all("productId = ?", [p.id]);
    const images = [];
    for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        images.push({
            id: "img-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
            productId: p.id,
            vendorId: vendor.id,
            url: "/api/v1/uploads/products/" + file.filename,
            position: existing.length + i,
            createdAt: nowISO(),
        });
    }
    for (const img of images) {
        await table("product_images").insert(img);
    }
    await table("products").update(p.id, { imageCount: existing.length + images.length });
    await addAudit(req, "updated", "product", p.id, "Added " + images.length + " image(s) to " + p.name, vendor.id);
    return res.status(201).json({ success: true, data: images });
});

export const deleteProductImage = asyncHandler(async (req, res) => {
    const { vendor } = await requireVendor(req, req.params.vendorId);
    const p = await table("products").find("id = ? AND vendorId = ?", [
        req.params.productId,
        req.params.vendorId,
    ]);
    if (!p) throw notFound("Product not found");
    const img = await table("product_images").find("id = ? AND productId = ?", [
        req.params.imageId,
        p.id,
    ]);
    if (!img) throw notFound("Image not found");

    await table("product_images").delete(img.id);

    /* re-index positions so the storefront keeps a stable order */
    const remaining = await table("product_images").all("productId = ?", [p.id], {
        order: "position, createdAt",
    });
    for (let i = 0; i < remaining.length; i += 1) {
        if (remaining[i].position !== i) {
            await table("product_images").update(remaining[i].id, { position: i });
        }
    }
    await table("products").update(p.id, { imageCount: remaining.length });

    const filePath = path.join(UPLOADS_DIR, String(img.url || "").replace("/api/v1/uploads/", ""));
    fs.unlink(filePath, (err) => {
        if (err) console.warn("Could not delete image file", filePath, err.message);
    });

    await addAudit(req, "updated", "product", p.id, "Removed an image from " + p.name, vendor.id);
    return res.json({ success: true, data: { deleted: img.id } });
});
