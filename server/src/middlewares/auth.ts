import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export type AuthedRequest = Request & { userId?: string; rid?: string };

/**
 * Require a valid JWT from Authorization: Bearer <token> or cookie `token`.
 * Sets `req.userId` for downstream handlers.
 */
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && typeof authHeader === "string") {
        const [scheme, value] = authHeader.split(" ");
        if (scheme?.toLowerCase() === "bearer" && value) {
            token = value.trim();
        }
    }
    if (!token && req.cookies?.token) {
        token = String(req.cookies.token);
    }

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = verifyToken(token);
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    (req as AuthedRequest).userId = userId;
    next();
};

export default isAuthenticated;
