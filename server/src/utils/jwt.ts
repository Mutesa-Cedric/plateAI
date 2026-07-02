import jwt = require("jsonwebtoken");

const MIN_SECRET_LEN = 16;

export function assertJwtSecretConfigured(opts?: { allowInsecureDev?: boolean }) {
    const secret = process.env.SECRET;
    const allow =
        opts?.allowInsecureDev === true ||
        process.env.ALLOW_INSECURE_DEV === "true";
    if (!secret || secret.length < MIN_SECRET_LEN) {
        const msg =
            `SECRET must be set and at least ${MIN_SECRET_LEN} characters. ` +
            `Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`;
        if (allow) {
            console.warn(`[security] WARNING: ${msg} (ALLOW_INSECURE_DEV=true — continuing)`);
            return;
        }
        throw new Error(msg);
    }
    if (
        secret === "change_this_to_a_long_random_secret_string" ||
        secret.includes("change_this")
    ) {
        const msg = "SECRET is still the example placeholder — set a unique production secret.";
        if (allow) {
            console.warn(`[security] WARNING: ${msg} (ALLOW_INSECURE_DEV=true — continuing)`);
            return;
        }
        throw new Error(msg);
    }
}

function secretOrThrow(): string {
    const secret = process.env.SECRET;
    if (!secret) {
        throw new Error("SECRET is not configured");
    }
    return secret;
}

/** Issue a time-limited access token for the given user id. */
export const generateToken = (userId: string) => {
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];
    return jwt.sign({ userId }, secretOrThrow(), { expiresIn });
};

/** Verify token; returns userId string or null if invalid/expired. */
export const verifyToken = (token: string): string | null => {
    try {
        const payload = jwt.verify(token, secretOrThrow()) as string | jwt.JwtPayload;
        if (typeof payload === "string") {
            // Legacy tokens signed with a bare string subject.
            return payload;
        }
        const id = (payload as jwt.JwtPayload).userId || (payload as jwt.JwtPayload).sub;
        return typeof id === "string" ? id : null;
    } catch {
        return null;
    }
};

export const extractPayload = (token: string) => verifyToken(token);
