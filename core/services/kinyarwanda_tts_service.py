"""Kinyarwanda text-to-speech via Pindo — returns audio bytes (no disk I/O)."""
import requests

url = "https://api.pindo.io/v1/transcription/tts"
REQUEST_TIMEOUT = (5, 30)  # connect, read


def kinyarwanda_text_to_speech(text: str) -> bytes:
    response = requests.post(
        url,
        json={"lang": "rw", "speech_rate": 1.0, "text": text},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.content
