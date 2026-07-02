/**
 * gRPC client for the private PlateAI core worker.
 * Mobile/web never dial this address — only this Express process does.
 */
import * as fs from "fs";
import * as path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

function resolveProtoPath(): string {
    const candidates = [
        path.resolve(__dirname, "../../../proto/ai.proto"), // server/src/grpc (ts-node)
        path.resolve(__dirname, "../../../../proto/ai.proto"), // server/dist/src/grpc
        path.resolve(process.cwd(), "../proto/ai.proto"), // cwd = server/
        path.resolve(process.cwd(), "proto/ai.proto"), // cwd = repo root
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error(
        `Could not find proto/ai.proto. Tried:\n${candidates.join("\n")}`
    );
}

const PROTO_PATH = resolveProtoPath();

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = grpc.loadPackageDefinition(packageDefinition) as any;
const PlateAI = proto.plateai.ai.PlateAI;

const CORE_GRPC_URL = process.env.CORE_GRPC_URL || "127.0.0.1:50051";

const channelOptions: grpc.ChannelOptions = {
    "grpc.max_send_message_length": 50 * 1024 * 1024,
    "grpc.max_receive_message_length": 50 * 1024 * 1024,
};

// Singleton insecure channel to co-located core (private network / loopback).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const coreClient: any = new PlateAI(
    CORE_GRPC_URL,
    grpc.credentials.createInsecure(),
    channelOptions
);

export function getCoreGrpcUrl(): string {
    return CORE_GRPC_URL;
}

/** Promisify a unary gRPC call. */
export function unaryCall<TReq, TRes>(
    method: string,
    request: TReq
): Promise<TRes> {
    return new Promise((resolve, reject) => {
        coreClient[method](request, (err: grpc.ServiceError | null, res: TRes) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
