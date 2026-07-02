require("dotenv").config();
import express = require("express");
import cors = require("cors");
import bodyParser = require("body-parser");
import cookieParser = require("cookie-parser");
import rateLimit from "express-rate-limit";
import authRouter from "./modules/auth/authRouter";
import mealsRouter from "./modules/meal/mealsRouter";
import aiRouter from "./modules/ai/aiRouter";
import { getCoreGrpcUrl } from "./grpc/coreClient";
import { assertJwtSecretConfigured } from "./utils/jwt";
import { log, newRequestId, preview } from "./utils/logger";

// Fail closed on weak/missing JWT secret (SEC-01).
assertJwtSecretConfigured();

const PORT = process.env.PORT || 8000;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "12mb";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const app = express();

// Needed for correct client IP behind reverse proxies when rate limiting.
if (process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
}

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            if (CORS_ORIGINS.length === 0) return callback(null, true);
            if (CORS_ORIGINS.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: CORS_ORIGINS.length > 0,
    })
);

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const helmet = require("helmet");
    app.use(helmet({ contentSecurityPolicy: false }));
    log.info("boot", "helmet security headers enabled");
} catch {
    log.warn("boot", "helmet not installed — run npm i helmet for security headers");
}

// ABUSE-02: rate limits (override via env for prod tuning).
const authLimiter = rateLimit({
    windowMs: Number(process.env.AUTH_RATE_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.AUTH_RATE_MAX || 30),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many auth attempts, please try again later" },
});

const aiLimiter = rateLimit({
    windowMs: Number(process.env.AI_RATE_WINDOW_MS || 60 * 1000),
    max: Number(process.env.AI_RATE_MAX || 40),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many AI requests, please slow down" },
});

app.use(bodyParser.json({ limit: JSON_BODY_LIMIT }));
app.use(cookieParser());

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

app.use("/auth", authLimiter, authRouter);
app.use("/meals", mealsRouter);
app.use("/ai", aiLimiter, aiRouter);

app.get("/", (_req, res) => {
    res.send("PlateAI API — clients should use /auth, /meals, and /ai");
});

app.get("/health", async (_req, res) => {
    res.json({ status: "ok", service: "server" });
});

app.listen(PORT, () => {
    log.info("boot", `HTTP listening on port ${PORT}`);
    log.info("boot", `Core gRPC target configured (private): ${getCoreGrpcUrl()}`);
    log.info("boot", `JSON body limit: ${JSON_BODY_LIMIT}`);
    log.info(
        "boot",
        CORS_ORIGINS.length
            ? `CORS allow-list: ${CORS_ORIGINS.join(", ")}`
            : "CORS allow-list empty (dev mode; set CORS_ORIGINS in production)"
    );
});
