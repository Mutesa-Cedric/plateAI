"""Kinyarwanda speech-to-text via Pindo — in-memory only."""
from io import BytesIO
import requests

url = "https://api.pindo.io/v1/transcription/stt"
# Bound worker-thread lifetime on the gRPC pool (critical under load).
REQUEST_TIMEOUT = (5, 30)  # connect, read


def kinyarwanda_speech_to_text(
    audio_bytes: bytes,
    content_type: str = "audio/wav",
    filename: str = "audio.wav",
) -> str:
    files = {
        "audio": (filename or "audio.wav", BytesIO(audio_bytes), content_type or "audio/wav")
    }
    response = requests.post(
        url, files=files, data={"lang": "rw"}, timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()
    return response.json()["text"]
