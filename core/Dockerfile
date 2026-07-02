# ── builder: generate gRPC stubs ──────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build
COPY core/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY proto/ /proto/
COPY core/ .

RUN mkdir -p generated \
 && python -m grpc_tools.protoc \
      -I /proto \
      --python_out=generated \
      --grpc_python_out=generated \
      /proto/ai.proto \
 && sed -i 's/import ai_pb2 as ai__pb2/from . import ai_pb2 as ai__pb2/' generated/ai_pb2_grpc.py \
 && touch generated/__init__.py

# ── runtime: no protoc / lighter surface ──────────────────────
FROM python:3.11-slim

WORKDIR /app

# Runtime deps only (grpcio-tools still listed for local setup parity but
# protoc generation already happened in the builder stage).
COPY core/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
 && pip uninstall -y grpcio-tools 2>/dev/null || true

COPY --from=builder /build /app

# Default to loopback-friendly docs; override in compose for private nets only.
ENV GRPC_HOST=127.0.0.1
ENV GRPC_PORT=50051

EXPOSE 50051

CMD ["python", "app.py"]
