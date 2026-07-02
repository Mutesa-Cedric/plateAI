/**
 * gRPC client for the private PlateAI core worker.
 * Mobile/web never dial this address — only this Express process does.
 *
 * Default channel is insecure and intended for co-located loopback
 * (CORE_GRPC_URL=127.0.0.1:50051). For non-loopback deployments set
 * CORE_GRPC_USE_TLS=true and point CORE_GRPC_URL at a TLS-terminated target.
 */
import * as fs from "fs";
import * as path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { log } from "../utils/logger";

function resolveProtoPath(): string {
    const candidates = [
        path.resolve(__dirname, "../../../proto/ai.proto"),
        path.resolve(__dirname, "../../../../proto/ai.proto"),
        path.resolve(process.cwd(), "../proto/ai.proto"),
        path.resolve(process.cwd(), "proto/ai.proto"),
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
const USE_TLS = process.env.CORE_GRPC_USE_TLS === "true";

const channelOptions: grpc.ChannelOptions = {
    "grpc.max_send_message_length": 50 * 1024 * 1024,
    "grpc.max_receive_message_length": 50 * 1024 * 1024,
};

function createCredentials(): grpc.ChannelCredentials {
    if (USE_TLS) {
        return grpc.credentials.createSsl();
    }
    const host = CORE_GRPC_URL.split(":")[0];
    if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
        log.warn(
            "grpc",
            "CORE_GRPC_URL is not loopback and CORE_GRPC_USE_TLS is not set — using insecure channel. Prefer loopback or enable TLS.",
            { core: CORE_GRPC_URL }
        );
    }
    return grpc.credentials.createInsecure();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const coreClient: any = new PlateAI(
    CORE_GRPC_URL,
    createCredentials(),
    channelOptions
);

export function getCoreGrpcUrl(): string {
    return CORE_GRPC_URL;
}

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
