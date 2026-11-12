import fs from "fs";
import path from "path";
import multer from "multer";

/*
|--------------------------------------------------------------------
| Product image uploads. Files land in <backend>/uploads/products and
| are served from /api/v1/uploads (see app.js). JPEG / PNG / WebP /
| AVIF / GIF only, 5 MB each, 8 files per request.
|--------------------------------------------------------------------
*/

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const PRODUCT_UPLOAD_DIR = path.join(UPLOADS_DIR, "products");

fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });

const EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PRODUCT_UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = EXT_BY_MIME[file.mimetype] || path.extname(file.originalname || "").toLowerCase() || ".bin";
        const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        cb(null, `${req.params.productId || "product"}-${unique}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(null, false);
};

export const productImageUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});
