import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    TTS_IBM_API_KEY = os.environ.get("TEXT_TO_SPEECH_IBM_API_KEY")
    TTS_IBM_URL = os.environ.get("TEXT_TO_SPEECH_IBM_URL")

    STT_IBM_API_KEY = os.environ.get("SPEECH_TO_TEXT_IBM_API_KEY")
    STT_IBM_URL = os.environ.get("SPEECH_TO_TEXT_IBM_URL")

    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

    DEBUG = os.environ.get("DEBUG", "True") == "True"

    # gRPC bind address — default loopback so core stays private to co-located server.
    GRPC_HOST = os.environ.get("GRPC_HOST", "127.0.0.1")
    GRPC_PORT = int(os.environ.get("GRPC_PORT", "50051"))
    GRPC_MAX_WORKERS = int(os.environ.get("GRPC_MAX_WORKERS", "20"))

    # Never log body previews of user/health data unless explicitly enabled.
    LOG_SENSITIVE_PREVIEWS = os.environ.get("LOG_SENSITIVE_PREVIEWS", "False") == "True"

    # Max STT audio assembled in memory (bytes). Align with server upload cap.
    STT_MAX_AUDIO_BYTES = int(os.environ.get("STT_MAX_AUDIO_BYTES", str(15 * 1024 * 1024)))
