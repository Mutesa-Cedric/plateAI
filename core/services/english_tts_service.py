from ibm_watson import TextToSpeechV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from config import Config
import uuid
import os

api_key = Config.TTS_IBM_API_KEY
url = Config.TTS_IBM_URL

def english_text_to_speech(text):
    authenticator = IAMAuthenticator(api_key)
    text_to_speech = TextToSpeechV1(authenticator=authenticator)
    text_to_speech.set_service_url(url)
    response = text_to_speech.synthesize(text, accept="audio/mp3", voice="en-US_AllisonV3Voice").get_result()

    # Save audio content to a file
    file_name = f"{uuid.uuid4()}.mp3"
    file_path = os.path.join('../audio', file_name)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'wb') as audio_file:
        audio_file.write(response.content)
    
    return file_name
