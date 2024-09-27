import jwt = require("jsonwebtoken");

export const generateToken = (payload: any) => {
    return jwt.sign(payload, process.env.SECRET as string);
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.SECRET as string);
}


// extract payload from token

export const extractPayload = (token: string) => {
    const payload = verifyToken(token);
    return payload;
};