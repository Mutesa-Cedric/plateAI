require("dotenv").config();
import express = require("express");
import cors = require("cors");
import bodyParser = require("body-parser");
import cookieParser = require("cookie-parser");
import authRouter from "./modules/auth/authRouter";
import mealsRouter from "./modules/meal/mealsRouter";
import aiRouter from "./modules/ai/aiRouter";
import { getCoreGrpcUrl } from "./grpc/coreClient";
import { log, newRequestId } from "./utils/logger";

const PORT = process.env.PORT || 8000;

const app = express();
app.use(cors());

app.listen(PORT, () => {
    log.info("boot", `HTTP listening on port ${PORT}`);
    log.info("boot", `Core gRPC target: ${getCoreGrpcUrl()} (private)`);
    log.info("boot", "Verbose request/response logging enabled for /ai/*");
});

// Large JSON bodies for meal images (base64) — STT prefers multipart/raw streaming.
app.use(bodyParser.json({ limit: "100mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,HEAD,OPTIONS,POST,PUT,DELETE"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization"
    );
    next();
});

// Request access log (all routes)
app.use((req, res, next) => {
    const rid = newRequestId();
    (req as any).rid = rid;
    const t0 = Date.now();
    const cl = req.headers["content-length"];
    log.info("http", `${req.method} ${req.originalUrl}`, {
        rid,
        contentType: req.headers["content-type"] || "-",
        contentLength: cl || "-",
        ip: req.ip,
    });
    res.on("finish", () => {
        log.info("http", `${req.method} ${req.originalUrl} → ${res.statusCode}`, {
            rid,
            ms: Date.now() - t0,
            status: res.statusCode,
        });
    });
    next();
});

app.use("/auth", authRouter);
app.use("/meals", mealsRouter);
// Public HTTP API for AI features — server proxies to private core via gRPC.
app.use("/ai", aiRouter);

app.get("/", (_req, res) => {
    res.send("PlateAI API — clients should use /auth, /meals, and /ai");
});

app.get("/health", async (_req, res) => {
    res.json({ status: "ok", service: "server", core_grpc: getCoreGrpcUrl() });
});
