from ibm_watson import SpeechToTextV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from config import Config

api_key = Config.STT_IBM_API_KEY
url = Config.STT_IBM_URL

def english_speech_to_text(audio_file):
    authenticator = IAMAuthenticator(api_key)
    speech_to_text = SpeechToTextV1(authenticator=authenticator)
    speech_to_text.set_service_url(url)
    result = speech_to_text.recognize(audio=audio_file, content_type="audio/wav").get_result()
    return result['results'][0]['alternatives'][0]['transcript']
