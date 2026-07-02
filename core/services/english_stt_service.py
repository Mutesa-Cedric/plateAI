"""English speech-to-text via IBM Watson — accepts in-memory audio bytes."""
from io import BytesIO
from ibm_watson import SpeechToTextV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from config import Config

api_key = Config.STT_IBM_API_KEY
url = Config.STT_IBM_URL


def english_speech_to_text(audio_bytes: bytes, content_type: str = "audio/wav") -> str:
    """Transcribe audio bytes; never writes to disk."""
    authenticator = IAMAuthenticator(api_key)
    speech_to_text = SpeechToTextV1(authenticator=authenticator)
    speech_to_text.set_service_url(url)
    result = speech_to_text.recognize(
        audio=BytesIO(audio_bytes),
        content_type=content_type or "audio/wav",
    ).get_result()
    results = result.get("results") or []
    if not results:
        return ""
    return results[0]["alternatives"][0]["transcript"]
