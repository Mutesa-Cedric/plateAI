import { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    // check if token is valid
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // verify token
    const payload = verifyToken(token);

    // check if payload is valid
    if (!payload) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    next();
};

export default isAuthenticated;