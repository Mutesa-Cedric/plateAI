import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    TTS_IBM_API_KEY = os.environ.get('TEXT_TO_SPEECH_IBM_API_KEY')
    TTS_IBM_URL = os.environ.get('TEXT_TO_SPEECH_IBM_URL')

    STT_IBM_API_KEY = os.environ.get('SPEECH_TO_TEXT_IBM_API_KEY')
    STT_IBM_URL = os.environ.get('SPEECH_TO_TEXT_IBM_URL')

    DEBUG = os.environ.get('DEBUG', 'True') == 'True'  # Convert to boolean
