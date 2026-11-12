import express from "express";
import cors from "cors";
import usersRouter from "./routes/api/v1/users.routes.js";
import errorMiddleware from './middleware/error.middleware.js';
import authRoutes from "./routes/api/v1/auth.routes.js";
import productsRoutes from "./routes/api/v1/products.routes.js";
import adminRoutes from "./routes/api/v1/admin.routes.js";
import catalogRoutes from "./routes/api/v1/catalog.routes.js";
import crmRoutes from "./routes/api/v1/crm.routes.js";
import customerRoutes from "./routes/api/v1/customer.routes.js";
import dashboardRoutes from "./routes/api/v1/dashboard.routes.js";
import expenseRoutes from "./routes/api/v1/expense.routes.js";
import financeRoutes from "./routes/api/v1/finance.routes.js";
import hrRoutes from "./routes/api/v1/hr.routes.js";
import inventoryRoutes from "./routes/api/v1/inventory.routes.js";
import platformRoutes from "./routes/api/v1/platform.routes.js";
import projectRoutes from "./routes/api/v1/project.routes.js";
import purchaseRoutes from "./routes/api/v1/purchase.routes.js";
import reportRoutes from "./routes/api/v1/report.routes.js";
import salesRoutes from "./routes/api/v1/sales.routes.js";
import shopRoutes from "./routes/api/v1/shop.routes.js";
import supplierRoutes from "./routes/api/v1/supplier.routes.js";
import ticketRoutes from "./routes/api/v1/ticket.routes.js";
import { attachUser } from "./middleware/auth.middleware.js";
import { UPLOADS_DIR } from "./middleware/upload.middleware.js";

const app = express();


app.use(express.json());
app.use(cors());




/*
| Product pictures uploaded through the vendor workspace. Served
| from /api/v1/uploads so the storefront reaches them through the
| same origin (the dev server proxies /api to this service).
*/
app.use("/api/v1/uploads", express.static(UPLOADS_DIR, { maxAge: "7d" }));

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to NexERP API"
    });
});


/*
| Resolve the caller for every request. Routes that need a session
| reject through requireUser (context.js) or authenticate; the rest
| just see an anonymous user.
*/
app.use(attachUser);

/*
| Every domain router carries the FULL contract paths (e.g.
| /vendor/:vendorId/orders), so all of them mount at /api/v1.
*/
app.use("/api/v1/users", usersRouter);
app.use( "/api/v1/auth", authRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1", catalogRoutes);
app.use("/api/v1", crmRoutes);
app.use("/api/v1", customerRoutes);
app.use("/api/v1", dashboardRoutes);
app.use("/api/v1", expenseRoutes);
app.use("/api/v1", financeRoutes);
app.use("/api/v1", hrRoutes);
app.use("/api/v1", inventoryRoutes);
app.use("/api/v1", platformRoutes);
app.use("/api/v1", projectRoutes);
app.use("/api/v1", purchaseRoutes);
app.use("/api/v1", reportRoutes);
app.use("/api/v1", salesRoutes);
app.use("/api/v1", shopRoutes);
app.use("/api/v1", supplierRoutes);
app.use("/api/v1", ticketRoutes);

/*
| Terminal 404 — JSON so a wrong path reads as clearly as any other
| error instead of Express' default HTML.
*/
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `No endpoint for ${req.method} ${req.path}`,
    });
});

app.use(errorMiddleware);


export default app;
