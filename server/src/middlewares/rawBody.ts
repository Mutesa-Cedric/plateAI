import { NextFunction, Request, Response } from "express";

export function rawBody(req: Request & { rawBody: string }, res: Response, next: NextFunction) {
    req.setEncoding('utf8');

    var data = '';

    req.on('data', function (chunk) {
        data += chunk;
    });

    req.on('end', function () {
        req.rawBody = data;

        next();
    });
}