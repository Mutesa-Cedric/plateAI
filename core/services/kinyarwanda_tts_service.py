import requests

url = "https://api.pindo.io/v1/transcription/tts"
data = {
    "lang": "rw",
    "speech_rate": 1.0
}

def kinyarwanda_text_to_speech(text):
    data["text"] = text
    response = requests.post(url, json=data)
    return response.content
