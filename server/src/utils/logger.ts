/**
 * Verbose structured-ish logs for the public API server.
 * Always verbose for AI routes so operators can trace gRPC proxying.
 */

function ts(): string {
    return new Date().toISOString();
}

function preview(value: unknown, limit = 160): string {
    if (value === undefined || value === null) return "<none>";
    let s: string;
    if (typeof value === "string") s = value;
    else {
        try {
            s = JSON.stringify(value);
        } catch {
            s = String(value);
        }
    }
    s = s.replace(/\n/g, "\\n");
    if (s.length > limit) return s.slice(0, limit) + `…(+${s.length - limit} chars)`;
    return s;
}

export const log = {
    info(scope: string, msg: string, meta?: Record<string, unknown>) {
        const extra = meta
            ? " " +
              Object.entries(meta)
                  .map(([k, v]) => `${k}=${typeof v === "string" ? v : preview(v, 80)}`)
                  .join(" ")
            : "";
        console.log(`${ts()} [server] INFO  [${scope}] ${msg}${extra}`);
    },
    warn(scope: string, msg: string, meta?: Record<string, unknown>) {
        const extra = meta
            ? " " +
              Object.entries(meta)
                  .map(([k, v]) => `${k}=${typeof v === "string" ? v : preview(v, 80)}`)
                  .join(" ")
            : "";
        console.warn(`${ts()} [server] WARN  [${scope}] ${msg}${extra}`);
    },
    error(scope: string, msg: string, err?: unknown, meta?: Record<string, unknown>) {
        const detail =
            err && typeof err === "object"
                ? (err as any).details || (err as any).message || String(err)
                : err
                  ? String(err)
                  : "";
        const extra = meta
            ? " " +
              Object.entries(meta)
                  .map(([k, v]) => `${k}=${typeof v === "string" ? v : preview(v, 80)}`)
                  .join(" ")
            : "";
        console.error(
            `${ts()} [server] ERROR [${scope}] ${msg}${extra}${detail ? ` err=${preview(detail, 300)}` : ""}`
        );
    },
    debug(scope: string, msg: string, meta?: Record<string, unknown>) {
        const extra = meta
            ? " " +
              Object.entries(meta)
                  .map(([k, v]) => `${k}=${typeof v === "string" ? v : preview(v, 120)}`)
                  .join(" ")
            : "";
        console.log(`${ts()} [server] DEBUG [${scope}] ${msg}${extra}`);
    },
    preview,
};

export function newRequestId(): string {
    return Math.random().toString(16).slice(2, 12);
}
