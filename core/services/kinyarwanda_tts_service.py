"""Kinyarwanda text-to-speech via Pindo — returns audio bytes (no disk I/O)."""
import requests

url = "https://api.pindo.io/v1/transcription/tts"


def kinyarwanda_text_to_speech(text: str) -> bytes:
    response = requests.post(
        url,
        json={"lang": "rw", "speech_rate": 1.0, "text": text},
    )
    response.raise_for_status()
    return response.content
