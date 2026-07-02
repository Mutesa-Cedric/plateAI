/**
 * Verbose structured-ish logs for the public API server.
 * All meta values (including strings) are sanitized to prevent log injection.
 */

function ts(): string {
    return new Date().toISOString();
}

/** Strip CR/LF and truncate — use for every untrusted value in logs. */
export function preview(value: unknown, limit = 160): string {
    if (value === undefined || value === null) return "<none>";
    let s: string;
    if (typeof value === "string") s = value;
    else if (typeof value === "number" || typeof value === "boolean") s = String(value);
    else {
        try {
            s = JSON.stringify(value);
        } catch {
            s = String(value);
        }
    }
    s = s.replace(/[\r\n\u0000]/g, " ");
    if (s.length > limit) return s.slice(0, limit) + `…(+${s.length - limit} chars)`;
    return s;
}

function formatMeta(meta?: Record<string, unknown>): string {
    if (!meta) return "";
    return (
        " " +
        Object.entries(meta)
            .map(([k, v]) => `${k}=${preview(v, 120)}`)
            .join(" ")
    );
}

export const log = {
    info(scope: string, msg: string, meta?: Record<string, unknown>) {
        console.log(`${ts()} [server] INFO  [${preview(scope, 40)}] ${preview(msg, 300)}${formatMeta(meta)}`);
    },
    warn(scope: string, msg: string, meta?: Record<string, unknown>) {
        console.warn(`${ts()} [server] WARN  [${preview(scope, 40)}] ${preview(msg, 300)}${formatMeta(meta)}`);
    },
    error(scope: string, msg: string, err?: unknown, meta?: Record<string, unknown>) {
        const detail =
            err && typeof err === "object"
                ? (err as any).details || (err as any).message || String(err)
                : err
                  ? String(err)
                  : "";
        console.error(
            `${ts()} [server] ERROR [${preview(scope, 40)}] ${preview(msg, 300)}${formatMeta(meta)}${
                detail ? ` err=${preview(detail, 300)}` : ""
            }`
        );
    },
    debug(scope: string, msg: string, meta?: Record<string, unknown>) {
        console.log(`${ts()} [server] DEBUG [${preview(scope, 40)}] ${preview(msg, 300)}${formatMeta(meta)}`);
    },
    preview,
};

export function newRequestId(): string {
    return Math.random().toString(16).slice(2, 12);
}

/** Prefer middleware-assigned rid so HTTP access logs and AI logs correlate. */
export function requestId(req: { rid?: string } | undefined): string {
    return (req && req.rid) || newRequestId();
}
