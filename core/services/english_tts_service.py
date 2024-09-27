from ibm_watson import TextToSpeechV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from config import Config
from flask import send_file

api_key = Config.TTS_IBM_API_KEY
url = Config.TTS_IBM_URL

def english_text_to_speech(text):
    authenticator = IAMAuthenticator(api_key)
    text_to_speech = TextToSpeechV1(authenticator=authenticator)
    text_to_speech.set_service_url(url)
    response = text_to_speech.synthesize(text, accept="audio/mp3", voice="en-US_AllisonV3Voice").get_result()

    return response.content
    