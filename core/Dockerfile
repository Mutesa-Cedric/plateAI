FROM python:3.11-slim

WORKDIR /app

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

# In containers, bind all interfaces; place behind private network / no public publish.
ENV GRPC_HOST=0.0.0.0
ENV GRPC_PORT=50051

EXPOSE 50051

CMD ["python", "app.py"]
