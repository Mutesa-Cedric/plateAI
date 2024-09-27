import requests
from io import BytesIO

url = "https://api.pindo.io/v1/transcription/stt"
data = {
    "lang": "rw"
}

# "wav", "wave", "mp3", "ogg", "flac", "aac", "wma", "webm", "mp4", "m4a"
def kinyarwanda_speech_to_text(audio_file):
    files = {
        'audio': (audio_file.filename, BytesIO(audio_file.read()), audio_file.mimetype)
    }
    response = requests.post(url, files=files, data=data)
    return response.json()['text']
