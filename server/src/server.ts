require("dotenv").config();
import express = require("express");
import cors = require("cors");
import bodyParser = require("body-parser");
import cookieParser = require("cookie-parser");
import authRouter from "./modules/auth/authRouter";
import mealsRouter from "./modules/meal/mealsRouter";
import aiRouter from "./modules/ai/aiRouter";
import { getCoreGrpcUrl } from "./grpc/coreClient";
import { log, newRequestId, preview } from "./utils/logger";

const PORT = process.env.PORT || 8000;

/** Comma-separated allow-list. Empty = reflect no credentials for unknown origins (safe default for tools). */
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const app = express();

app.use(
    cors({
        origin(origin, callback) {
            // Non-browser / same-origin tools (curl, mobile) often send no Origin.
            if (!origin) return callback(null, true);
            if (CORS_ORIGINS.length === 0) {
                // Dev-friendly: allow all when no list configured, but without
                // reflecting arbitrary Origin + credentials together.
                return callback(null, true);
            }
            if (CORS_ORIGINS.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: CORS_ORIGINS.length > 0,
    })
);

// Baseline security headers (helmet optional dependency — soft require).
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const helmet = require("helmet");
    app.use(helmet({ contentSecurityPolicy: false }));
    log.info("boot", "helmet security headers enabled");
} catch {
    log.warn("boot", "helmet not installed — run npm i helmet for security headers");
}

app.listen(PORT, () => {
    log.info("boot", `HTTP listening on port ${PORT}`);
    log.info("boot", `Core gRPC target configured (private): ${getCoreGrpcUrl()}`);
    log.info(
        "boot",
        CORS_ORIGINS.length
            ? `CORS allow-list: ${CORS_ORIGINS.join(", ")}`
            : "CORS allow-list empty (dev mode; set CORS_ORIGINS in production)"
    );
});

app.use(bodyParser.json({ limit: "100mb" }));
app.use(cookieParser());

// Request access log (sanitized) — single rid shared with AI controller via req.rid
app.use((req, res, next) => {
    const rid = newRequestId();
    (req as any).rid = rid;
    const t0 = Date.now();
    log.info("http", "request", {
        rid,
        method: preview(req.method, 16),
        path: preview(req.originalUrl, 200),
        contentType: preview(req.headers["content-type"] || "-", 80),
        contentLength: preview(req.headers["content-length"] || "-", 32),
    });
    res.on("finish", () => {
        log.info("http", "response", {
            rid,
            method: preview(req.method, 16),
            path: preview(req.originalUrl, 200),
            status: res.statusCode,
            ms: Date.now() - t0,
        });
    });
    next();
});

app.use("/auth", authRouter);
app.use("/meals", mealsRouter);
app.use("/ai", aiRouter);

app.get("/", (_req, res) => {
    res.send("PlateAI API — clients should use /auth, /meals, and /ai");
});

app.get("/health", async (_req, res) => {
    // Public health: no internal topology leak.
    res.json({ status: "ok", service: "server" });
});
