import { Request, Response } from "express";
import Busboy = require("busboy");
import { coreClient, unaryCall, getCoreGrpcUrl } from "../../grpc/coreClient";
import { log, newRequestId } from "../../utils/logger";

/**
 * HTTP façade over the private core gRPC service.
 * STT/TTS use streaming end-to-end (no disk, no second full re-upload hop).
 * All handlers log request shape + response summary for operator visibility.
 */
export default class AiController {
    public static async health(_req: Request, res: Response) {
        const rid = newRequestId();
        log.info("ai/health", "→ probing core gRPC", {
            rid,
            core: getCoreGrpcUrl(),
        });
        try {
            const result = await unaryCall<{}, { status: string; service: string }>(
                "Health",
                {}
            );
            log.info("ai/health", "← core ok", { rid, core: result });
            res.json({
                status: "ok",
                service: "server",
                core: result,
                core_grpc: getCoreGrpcUrl(),
            });
        } catch (error: any) {
            log.error("ai/health", "← core unreachable", error, { rid });
            res.status(503).json({
                status: "degraded",
                service: "server",
                core_error: error?.details || error?.message || String(error),
                core_grpc: getCoreGrpcUrl(),
            });
        }
    }

    public static async dietCheck(req: Request, res: Response) {
        const rid = newRequestId();
        const t0 = Date.now();
        try {
            const body = req.body || {};
            let image: Buffer | undefined;

            if (body.image && typeof body.image === "string" && !body.base64) {
                const raw = body.image.replace(/^data:image\/\w+;base64,/, "");
                image = Buffer.from(raw, "base64");
            } else if (body.base64) {
                const raw = String(body.base64).replace(/^data:image\/\w+;base64,/, "");
                image = Buffer.from(raw, "base64");
            }

            log.info("ai/diet-check", "→ request", {
                rid,
                hasImageField: Boolean(body.image),
                hasBase64Field: Boolean(body.base64),
                imageBytes: image?.length ?? 0,
            });

            if (!image || image.length === 0) {
                log.warn("ai/diet-check", "rejected missing image", { rid });
                return res.status(400).json({ message: "image or base64 required" });
            }

            const result = await unaryCall<
                { image: Buffer; base64: string },
                { result_json: string }
            >("DietCheck", { image, base64: "" });

            const parsed = JSON.parse(result.result_json || "null");
            log.info("ai/diet-check", "← response", {
                rid,
                ms: Date.now() - t0,
                resultJsonChars: (result.result_json || "").length,
                preview: log.preview(parsed, 200),
            });
            return res.json(parsed);
        } catch (error: any) {
            log.error("ai/diet-check", "← failed", error, {
                rid,
                ms: Date.now() - t0,
            });
            return res.status(502).json({
                message: "AI core error",
                detail: error?.details || error?.message,
            });
        }
    }

    public static async advisor(req: Request, res: Response) {
        const rid = newRequestId();
        const t0 = Date.now();
        try {
            const { recent_meal, user, past_meals } = req.body || {};
            log.info("ai/advisor", "→ request", {
                rid,
                userPreview: log.preview(user, 120),
                recentMealPreview: log.preview(recent_meal, 120),
                pastMealsCount: Array.isArray(past_meals) ? past_meals.length : "n/a",
            });

            const result = await unaryCall<
                { recent_meal_json: string; user_json: string; past_meals_json: string },
                { advice: string }
            >("Advisor", {
                recent_meal_json: JSON.stringify(recent_meal ?? null),
                user_json: JSON.stringify(user ?? null),
                past_meals_json: JSON.stringify(past_meals ?? []),
            });

            log.info("ai/advisor", "← response", {
                rid,
                ms: Date.now() - t0,
                adviceChars: (result.advice || "").length,
                preview: log.preview(result.advice),
            });
            return res.json({ advice: result.advice });
        } catch (error: any) {
            log.error("ai/advisor", "← failed", error, { rid, ms: Date.now() - t0 });
            return res.status(502).json({
                message: "AI core error",
                detail: error?.details || error?.message,
            });
        }
    }

    public static async cookForMe(req: Request, res: Response) {
        const rid = newRequestId();
        const t0 = Date.now();
        try {
            const { user, meal_history } = req.body || {};
            log.info("ai/cook-for-me", "→ request", {
                rid,
                userPreview: log.preview(user, 120),
                mealHistoryCount: Array.isArray(meal_history)
                    ? meal_history.length
                    : "n/a",
            });

            if (!user || !meal_history) {
                log.warn("ai/cook-for-me", "rejected missing fields", { rid });
                return res
                    .status(400)
                    .json({ error: "User profile and meal history are required" });
            }

            const result = await unaryCall<
                { user_json: string; meal_history_json: string },
                { response: string; image: string }
            >("CookForMe", {
                user_json: JSON.stringify(user),
                meal_history_json: JSON.stringify(meal_history),
            });

            log.info("ai/cook-for-me", "← response", {
                rid,
                ms: Date.now() - t0,
                responseChars: (result.response || "").length,
                imageChars: (result.image || "").length,
                preview: log.preview(result.response),
            });
            return res.json({ response: result.response, image: result.image });
        } catch (error: any) {
            log.error("ai/cook-for-me", "← failed", error, {
                rid,
                ms: Date.now() - t0,
            });
            return res.status(502).json({
                message: "AI core error",
                detail: error?.details || error?.message,
            });
        }
    }

    public static async chat(req: Request, res: Response) {
        const rid = newRequestId();
        const t0 = Date.now();
        try {
            const prompt = req.body?.prompt;
            log.info("ai/chat", "→ request", {
                rid,
                promptChars: prompt ? String(prompt).length : 0,
                preview: log.preview(prompt),
            });

            if (!prompt) {
                log.warn("ai/chat", "rejected empty prompt", { rid });
                return res.status(400).json({ message: "prompt is required" });
            }

            const result = await unaryCall<{ prompt: string }, { response: string }>(
                "Chat",
                { prompt }
            );

            log.info("ai/chat", "← response", {
                rid,
                ms: Date.now() - t0,
                responseChars: (result.response || "").length,
                preview: log.preview(result.response),
            });
            return res.json({ response: result.response });
        } catch (error: any) {
            log.error("ai/chat", "← failed", error, { rid, ms: Date.now() - t0 });
            return res.status(502).json({
                message: "AI core error",
                detail: error?.details || error?.message,
            });
        }
    }

    /**
     * POST /ai/stt?language=en
     * multipart field "audio", raw audio/*, or JSON audio_base64.
     * Streams chunks into core SpeechToText as they arrive — no disk write.
     */
    public static stt(req: Request, res: Response) {
        const rid = newRequestId();
        const t0 = Date.now();
        const language = String(req.query.language || "en").toLowerCase();
        const contentTypeHeader = String(req.headers["content-type"] || "");

        log.info("ai/stt", "→ stream open", {
            rid,
            language,
            contentType: contentTypeHeader,
            contentLength: req.headers["content-length"] || "chunked/unknown",
            peer: req.ip,
        });

        let settled = false;
        let bytesToCore = 0;
        let framesToCore = 0;

        const fail = (status: number, payload: object) => {
            if (settled || res.headersSent) return;
            settled = true;
            log.warn("ai/stt", "← error response", {
                rid,
                status,
                ms: Date.now() - t0,
                payload: log.preview(payload),
                bytesToCore,
                framesToCore,
            });
            res.status(status).json(payload);
        };

        const call = coreClient.SpeechToText((err: any, result: { text: string }) => {
            if (err) {
                log.error("ai/stt", "← gRPC error", err, {
                    rid,
                    ms: Date.now() - t0,
                    bytesToCore,
                    framesToCore,
                });
                fail(502, {
                    message: "AI core error",
                    detail: err?.details || err?.message,
                });
                return;
            }
            if (!settled && !res.headersSent) {
                settled = true;
                log.info("ai/stt", "← response", {
                    rid,
                    ms: Date.now() - t0,
                    bytesToCore,
                    framesToCore,
                    textChars: (result?.text || "").length,
                    preview: log.preview(result?.text),
                });
                res.json({ text: result?.text ?? "" });
            }
        });

        call.on("error", (err: Error) => {
            log.error("ai/stt", "stream error", err, { rid });
            fail(502, { message: "AI core stream error", detail: err.message });
        });

        const sendConfig = (contentType: string, filename: string) => {
            log.info("ai/stt", "→ gRPC config frame", {
                rid,
                language,
                contentType,
                filename,
            });
            call.write({
                config: {
                    language,
                    content_type: contentType,
                    filename,
                },
            });
        };

        const writeAudio = (chunk: Buffer) => {
            bytesToCore += chunk.length;
            framesToCore += 1;
            if (framesToCore === 1 || framesToCore % 20 === 0) {
                log.debug("ai/stt", "→ gRPC audio frame", {
                    rid,
                    frame: framesToCore,
                    chunkBytes: chunk.length,
                    totalBytes: bytesToCore,
                });
            }
            call.write({ audio: chunk });
        };

        const pipeAudioBuffer = (buf: Buffer) => {
            const CHUNK = 16 * 1024;
            for (let i = 0; i < buf.length; i += CHUNK) {
                writeAudio(buf.subarray(i, i + CHUNK));
            }
        };

        // Raw audio body (streamed).
        if (contentTypeHeader.startsWith("audio/")) {
            sendConfig(contentTypeHeader.split(";")[0].trim(), "audio.bin");
            req.on("data", (chunk: Buffer) => writeAudio(chunk));
            req.on("end", () => {
                log.info("ai/stt", "HTTP body end → closing gRPC client stream", {
                    rid,
                    bytesToCore,
                    framesToCore,
                });
                call.end();
            });
            req.on("error", (err) => {
                try {
                    call.cancel();
                } catch {
                    /* ignore */
                }
                fail(400, { message: "upload failed", detail: err.message });
            });
            return;
        }

        // multipart/form-data — stream the audio field without touching disk.
        if (contentTypeHeader.includes("multipart/form-data")) {
            let configured = false;
            const busboy = Busboy({ headers: req.headers });

            busboy.on("file", (fieldname, file, info) => {
                log.info("ai/stt", "multipart file field", {
                    rid,
                    fieldname,
                    filename: info.filename,
                    mimeType: info.mimeType,
                });
                if (fieldname !== "audio" && fieldname !== "file") {
                    log.debug("ai/stt", "skipping non-audio field", { rid, fieldname });
                    file.resume();
                    return;
                }
                const mime = info.mimeType || "audio/wav";
                const filename = info.filename || "audio.wav";
                if (!configured) {
                    sendConfig(mime, filename);
                    configured = true;
                }
                file.on("data", (chunk: Buffer) => writeAudio(chunk));
            });

            busboy.on("finish", () => {
                if (!configured) {
                    try {
                        call.cancel();
                    } catch {
                        /* ignore */
                    }
                    fail(400, { message: "audio file field required" });
                    return;
                }
                log.info("ai/stt", "multipart finish → closing gRPC client stream", {
                    rid,
                    bytesToCore,
                    framesToCore,
                });
                call.end();
            });

            busboy.on("error", (err: Error) => {
                try {
                    call.cancel();
                } catch {
                    /* ignore */
                }
                fail(400, { message: "multipart parse error", detail: err.message });
            });

            req.pipe(busboy);
            return;
        }

        // JSON fallback: still forwarded to gRPC in chunks (no disk).
        if (contentTypeHeader.includes("application/json")) {
            const body = req.body || {};
            const b64 = body.audio_base64 || body.audio || body.base64;
            if (!b64) {
                try {
                    call.cancel();
                } catch {
                    /* ignore */
                }
                return fail(400, { message: "audio_base64 required for JSON STT" });
            }
            const buf = Buffer.from(String(b64), "base64");
            log.info("ai/stt", "JSON base64 audio", {
                rid,
                decodedBytes: buf.length,
            });
            sendConfig(body.content_type || "audio/wav", body.filename || "audio.wav");
            pipeAudioBuffer(buf);
            call.end();
            return;
        }

        try {
            call.cancel();
        } catch {
            /* ignore */
        }
        return fail(415, {
            message:
                "Unsupported Content-Type. Use multipart/form-data (field audio), audio/*, or application/json with audio_base64.",
        });
    }

    /**
     * POST /ai/tts?language=en  body: { text }
     * Streams audio/mpeg bytes from core to the HTTP client — no disk, no audio_url.
     */
    public static tts(req: Request, res: Response) {
        const rid = newRequestId();
        const t0 = Date.now();
        const text = req.body?.text;
        const language = String(
            req.query.language || req.body?.language || "en"
        ).toLowerCase();

        log.info("ai/tts", "→ request", {
            rid,
            language,
            textChars: text ? String(text).length : 0,
            preview: log.preview(text),
        });

        if (!text || !String(text).trim()) {
            log.warn("ai/tts", "rejected empty text", { rid });
            return res.status(400).json({ message: "text is required" });
        }

        let headersSent = false;
        let bytesFromCore = 0;
        let framesFromCore = 0;
        const call = coreClient.TextToSpeech({ text: String(text), language });

        call.on("data", (chunk: { data: Buffer | Uint8Array; content_type?: string }) => {
            if (!headersSent) {
                const ct = chunk.content_type || "audio/mpeg";
                res.setHeader("Content-Type", ct);
                res.setHeader("Cache-Control", "no-store");
                headersSent = true;
                log.info("ai/tts", "← first gRPC frame, opening HTTP stream", {
                    rid,
                    contentType: ct,
                });
            }
            const data = Buffer.isBuffer(chunk.data)
                ? chunk.data
                : Buffer.from(chunk.data || []);
            bytesFromCore += data.length;
            framesFromCore += 1;
            if (framesFromCore === 1 || framesFromCore % 10 === 0) {
                log.debug("ai/tts", "← gRPC audio frame → HTTP client", {
                    rid,
                    frame: framesFromCore,
                    chunkBytes: data.length,
                    totalBytes: bytesFromCore,
                });
            }
            if (data.length) {
                res.write(data);
            }
        });

        call.on("end", () => {
            log.info("ai/tts", "← stream complete", {
                rid,
                ms: Date.now() - t0,
                framesFromCore,
                bytesFromCore,
                headersSent,
            });
            if (!headersSent) {
                res.status(204).end();
            } else {
                res.end();
            }
        });

        call.on("error", (err: any) => {
            log.error("ai/tts", "← gRPC error", err, {
                rid,
                ms: Date.now() - t0,
                bytesFromCore,
                framesFromCore,
            });
            if (!headersSent) {
                res.status(502).json({
                    message: "AI core error",
                    detail: err?.details || err?.message,
                });
            } else {
                try {
                    res.destroy(err);
                } catch {
                    /* ignore */
                }
            }
        });
    }
}
