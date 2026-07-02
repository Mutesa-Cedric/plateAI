/**
 * End-to-end streaming test for /ai/stt and /ai/tts.
 *
 * - Requires a real audio fixture under repo `audio/` (used as STT upload payload).
 * - Spins a mock gRPC core so we can assert exact byte counts without API keys.
 * - Asserts no *new* files are written under `audio/` during the run (fixtures OK).
 *
 * Usage (from server/):
 *   npx ts-node --transpile-only scripts/test_ai_stream_e2e.ts
 */
import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { spawn, ChildProcess } from "child_process";

const REPO_ROOT = path.resolve(__dirname, "../..");
const AUDIO_DIR = path.join(REPO_ROOT, "audio");
const PROTO = path.join(REPO_ROOT, "proto/ai.proto");

/** Pick an ephemeral free TCP port so re-runs never hit EADDRINUSE. */
async function getFreePort(): Promise<number> {
  const net = await import("net");
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      if (!addr || typeof addr === "string") {
        s.close();
        reject(new Error("could not allocate free port"));
        return;
      }
      const port = addr.port;
      s.close((err) => (err ? reject(err) : resolve(port)));
    });
    s.on("error", reject);
  });
}

const AUDIO_EXTS = new Set([
  ".mp3",
  ".wav",
  ".wave",
  ".ogg",
  ".flac",
  ".m4a",
  ".webm",
  ".aac",
  ".wma",
]);

function resolveAudioFixture(): string {
  if (!fs.existsSync(AUDIO_DIR)) {
    throw new Error(
      `Missing audio fixture directory: ${AUDIO_DIR}\n` +
        `Add a real audio file (e.g. sample.mp3) under audio/ and re-run.`
    );
  }
  const files = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => !f.startsWith("."))
    .filter((f) => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(AUDIO_DIR, f))
    .filter((p) => fs.statSync(p).isFile())
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);

  if (!files.length) {
    throw new Error(
      `No audio files found in ${AUDIO_DIR}.\n` +
        `Place a real .mp3/.wav (etc.) there to exercise streaming STT.`
    );
  }
  return files[0];
}

function snapshotAudioDir(): Map<string, { size: number; mtimeMs: number }> {
  const map = new Map<string, { size: number; mtimeMs: number }>();
  if (!fs.existsSync(AUDIO_DIR)) return map;
  for (const name of fs.readdirSync(AUDIO_DIR)) {
    if (name.startsWith(".")) continue;
    const full = path.join(AUDIO_DIR, name);
    const st = fs.statSync(full);
    if (st.isFile()) map.set(name, { size: st.size, mtimeMs: st.mtimeMs });
  }
  return map;
}

function assertNoNewAudioFiles(before: Map<string, { size: number; mtimeMs: number }>) {
  const after = snapshotAudioDir();
  const newFiles: string[] = [];
  for (const [name, meta] of after) {
    const prev = before.get(name);
    if (!prev) {
      newFiles.push(`${name} (new, ${meta.size} bytes)`);
    } else if (meta.size !== prev.size || meta.mtimeMs > prev.mtimeMs + 1) {
      // Fixture may be touched by OS; only flag size changes as writes from our stack.
      if (meta.size !== prev.size) {
        newFiles.push(
          `${name} (size changed ${prev.size} → ${meta.size})`
        );
      }
    }
  }
  if (newFiles.length) {
    throw new Error(
      `Streaming must not write audio to disk, but audio/ changed:\n  - ${newFiles.join(
        "\n  - "
      )}`
    );
  }
}

const def = protoLoader.loadSync(PROTO, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = grpc.loadPackageDefinition(def) as any;

async function main() {
  const fixturePath = resolveAudioFixture();
  const fixtureBuf = fs.readFileSync(fixturePath);
  const fixtureName = path.basename(fixturePath);
  const fixtureExt = path.extname(fixtureName).toLowerCase();
  const contentType =
    fixtureExt === ".wav" || fixtureExt === ".wave"
      ? "audio/wav"
      : fixtureExt === ".mp3"
        ? "audio/mpeg"
        : fixtureExt === ".ogg"
          ? "audio/ogg"
          : fixtureExt === ".webm"
            ? "audio/webm"
            : "application/octet-stream";

  console.log("── fixture ──────────────────────────────────────");
  console.log(`  path: ${fixturePath}`);
  console.log(`  size: ${fixtureBuf.length} bytes`);
  console.log(`  type: ${contentType}`);
  console.log("─────────────────────────────────────────────────");

  const beforeAudio = snapshotAudioDir();
  console.log(
    `audio/ snapshot before run: ${beforeAudio.size} file(s) — fixtures allowed`
  );

  // ── mock core ──────────────────────────────────────────────
  const server = new grpc.Server({
    "grpc.max_send_message_length": 50 * 1024 * 1024,
    "grpc.max_receive_message_length": 50 * 1024 * 1024,
  });

  // TTS response payload size (streamed in 16KiB frames)
  const fakeMp3 = Buffer.alloc(40 * 1024, 0xab);
  let lastSttBytes = 0;
  let lastSttLanguage = "";
  let lastSttChunks = 0;

  server.addService(proto.plateai.ai.PlateAI.service, {
    Health: (_req: unknown, cb: Function) =>
      cb(null, { status: "ok", service: "core-mock" }),
    TextToSpeech: (call: any) => {
      const text = call.request?.text || "";
      const language = call.request?.language || "en";
      console.log(
        `[mock-core] TextToSpeech request text_len=${text.length} language=${language}`
      );
      if (!text) {
        call.emit("error", {
          code: grpc.status.INVALID_ARGUMENT,
          details: "text required",
        });
        return;
      }
      const chunkSize = 16 * 1024;
      let first = true;
      let frames = 0;
      for (let i = 0; i < fakeMp3.length; i += chunkSize) {
        call.write({
          data: fakeMp3.subarray(i, i + chunkSize),
          content_type: first ? "audio/mpeg" : "",
        });
        first = false;
        frames++;
      }
      call.end();
      console.log(
        `[mock-core] TextToSpeech response frames=${frames} total_bytes=${fakeMp3.length}`
      );
    },
    SpeechToText: (call: any, cb: Function) => {
      const parts: Buffer[] = [];
      let language = "en";
      let frames = 0;
      call.on("data", (msg: any) => {
        if (msg.config) {
          language = msg.config.language || language;
          console.log(
            `[mock-core] SpeechToText config language=${language} content_type=${msg.config.content_type} filename=${msg.config.filename}`
          );
        }
        if (msg.audio && msg.audio.length) {
          parts.push(Buffer.from(msg.audio));
          frames++;
        }
      });
      call.on("end", () => {
        const total = Buffer.concat(parts);
        lastSttBytes = total.length;
        lastSttLanguage = language;
        lastSttChunks = frames;
        const text = `mock-transcript:${language}:${total.length}`;
        console.log(
          `[mock-core] SpeechToText response text="${text}" audio_bytes=${total.length} frames=${frames}`
        );
        cb(null, { text });
      });
    },
    DietCheck: (_req: unknown, cb: Function) => cb(null, { result_json: "[]" }),
    Advisor: (_req: unknown, cb: Function) => cb(null, { advice: "ok" }),
    CookForMe: (_req: unknown, cb: Function) =>
      cb(null, { response: "ok", image: "" }),
    Chat: (_req: unknown, cb: Function) => cb(null, { response: "ok" }),
  });

  const grpcPort = await new Promise<number>((resolve, reject) => {
    server.bindAsync(
      "127.0.0.1:0",
      grpc.ServerCredentials.createInsecure(),
      (err, bound) => (err ? reject(err) : resolve(bound))
    );
  });
  const coreUrl = `127.0.0.1:${grpcPort}`;
  console.log(`mock core gRPC on ${coreUrl}`);

  const HTTP_PORT = await getFreePort();
  console.log(`ephemeral HTTP port for test server: ${HTTP_PORT}`);

  // ── express child against mock core ────────────────────────
  const child: ChildProcess = spawn(
    "npx",
    ["ts-node", "--transpile-only", "src/server.ts"],
    {
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        CORE_GRPC_URL: coreUrl,
        PORT: String(HTTP_PORT),
        LOG_VERBOSE: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("server start timeout")), 20000);
    const onData = (d: Buffer) => {
      const s = d.toString();
      process.stdout.write("[server] " + s);
      if (s.includes("listening")) {
        clearTimeout(t);
        resolve();
      }
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", (d: Buffer) =>
      process.stderr.write("[server-err] " + d)
    );
    child.on("exit", (code) => {
      clearTimeout(t);
      reject(new Error("server exited " + code));
    });
  });
  await new Promise((r) => setTimeout(r, 400));

  // ── TTS stream ─────────────────────────────────────────────
  console.log("\n▶ POST /ai/tts (server-stream audio)");
  const ttsBody = await httpRequest({
    method: "POST",
    host: "127.0.0.1",
    port: HTTP_PORT,
    path: "/ai/tts?language=en",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Streaming TTS test from PlateAI e2e — no disk writes.",
    }),
  });
  if (ttsBody.status !== 200) {
    throw new Error(
      `tts status ${ttsBody.status}: ${ttsBody.body.toString().slice(0, 400)}`
    );
  }
  if (!String(ttsBody.headers["content-type"] || "").includes("audio/mpeg")) {
    throw new Error(`bad content-type ${ttsBody.headers["content-type"]}`);
  }
  if (ttsBody.body.length !== fakeMp3.length) {
    throw new Error(
      `tts size ${ttsBody.body.length} != expected ${fakeMp3.length}`
    );
  }
  console.log(`✔ TTS stream OK — received ${ttsBody.body.length} bytes audio/mpeg`);

  // ── STT stream with REAL fixture file ──────────────────────
  console.log(`\n▶ POST /ai/stt (client-stream real fixture: ${fixtureName})`);
  const boundary = "----plateai" + Date.now();
  const preamble = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="audio"; filename="${fixtureName}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
  );
  const closing = Buffer.from(`\r\n--${boundary}--\r\n`);
  const multipart = Buffer.concat([preamble, fixtureBuf, closing]);

  const sttBody = await httpRequest({
    method: "POST",
    host: "127.0.0.1",
    port: HTTP_PORT,
    path: "/ai/stt?language=en",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(multipart.length),
    },
    body: multipart,
  });
  if (sttBody.status !== 200) {
    throw new Error(
      `stt status ${sttBody.status}: ${sttBody.body.toString().slice(0, 400)}`
    );
  }
  const parsed = JSON.parse(sttBody.body.toString());
  const expectedText = `mock-transcript:en:${fixtureBuf.length}`;
  if (parsed.text !== expectedText) {
    throw new Error(
      `unexpected transcript "${parsed.text}" (expected "${expectedText}"). ` +
        `mock received bytes=${lastSttBytes} frames=${lastSttChunks} lang=${lastSttLanguage}`
    );
  }
  if (lastSttBytes !== fixtureBuf.length) {
    throw new Error(
      `mock core received ${lastSttBytes} audio bytes, fixture is ${fixtureBuf.length}`
    );
  }
  if (lastSttChunks < 2 && fixtureBuf.length > 16 * 1024) {
    throw new Error(
      `expected multi-frame stream for ${fixtureBuf.length} byte file, got frames=${lastSttChunks}`
    );
  }
  console.log(
    `✔ STT stream OK — fixture ${fixtureBuf.length} bytes in ${lastSttChunks} gRPC frames → "${parsed.text}"`
  );

  // ── also exercise raw audio/* body stream path ─────────────
  console.log("\n▶ POST /ai/stt raw audio/* body stream");
  const sttRaw = await httpRequest({
    method: "POST",
    host: "127.0.0.1",
    port: HTTP_PORT,
    path: "/ai/stt?language=en",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fixtureBuf.length),
    },
    body: fixtureBuf,
  });
  if (sttRaw.status !== 200) {
    throw new Error(
      `raw stt status ${sttRaw.status}: ${sttRaw.body.toString().slice(0, 400)}`
    );
  }
  const rawParsed = JSON.parse(sttRaw.body.toString());
  if (rawParsed.text !== expectedText) {
    throw new Error(`raw stt unexpected transcript "${rawParsed.text}"`);
  }
  console.log(`✔ raw audio/* STT stream OK — "${rawParsed.text}"`);

  // Fixtures may exist; only fail if the run *wrote* new/changed audio files.
  assertNoNewAudioFiles(beforeAudio);
  console.log(
    "✔ no new/changed files under audio/ during run (fixtures preserved, no disk writes from stack)"
  );

  child.kill("SIGTERM");
  server.forceShutdown();
  console.log("\nALL E2E STREAM CHECKS PASSED (real audio fixture used)");
  process.exit(0);
}

function httpRequest(opts: {
  method: string;
  host: string;
  port: number;
  path: string;
  headers: Record<string, any>;
  body: string | Buffer;
}): Promise<{ status: number; headers: any; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.isBuffer(opts.body)
      ? opts.body
      : Buffer.from(opts.body);
    const headers = { ...opts.headers };
    if (headers["Content-Length"] === undefined) {
      headers["Content-Length"] = String(bodyBuf.length);
    }
    const req = http.request(
      {
        method: opts.method,
        host: opts.host,
        port: opts.port,
        path: opts.path,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          })
        );
      }
    );
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}

main().catch((e) => {
  console.error("\nE2E FAILED:", e);
  process.exit(1);
});
