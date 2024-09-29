from flask import Blueprint, request, jsonify, Response
from services.english_stt_service import english_speech_to_text
from services.english_tts_service import english_text_to_speech
from services.kinyarwanda_stt_service import kinyarwanda_speech_to_text
from services.kinyarwanda_tts_service import kinyarwanda_text_to_speech
from services.diet_check_service import diet_check
from services.advisor_service import advisor_service
from services.cook_meal_service import suggest_next_meal
from services.chat_service import respond_prompt
from flask import send_from_directory

api = Blueprint('api', __name__)

@api.route('/tts', methods=['POST'])
def tts():
    language = request.args.get('language', 'en')
    text = request.json.get('text')

    if language == 'en':
        filename = english_text_to_speech(text)
        audio_url = f"http://157.173.127.185:5000/audio/{filename}"
        return {"audio_url": audio_url}
    elif language == 'rw':
        res = kinyarwanda_text_to_speech(text)
        return res

@api.route('/stt', methods=['POST'])
def stt():
    language = request.args.get('language', 'en')
    audio_file = request.files['audio']
    
    if language == 'en':
        text = english_speech_to_text(audio_file)
    elif language == 'rw':
        text = kinyarwanda_speech_to_text(audio_file)

    return jsonify({"text": text})

@api.route('/diet-check', methods=['POST'])
def diet_checker():
    image = request.json.get("base64")
    ingredients = diet_check(image)

    return jsonify(ingredients)

@api.route('/advisor', methods=['POST'])
def advisor():
    recent_meal = request.json.get("recent_meal")
    user = request.json.get("user")
    past_meals = request.json.get("past_meals")
    analysis = advisor_service(recent_meal, user, past_meals)

    return jsonify(analysis)

@api.route('/cook-for-me', methods=['POST'])
def cook_next_meal():
    data = request.json
    user_profile = data.get('user')
    meal_history = data.get('meal_history')

    if not user_profile or not meal_history:
        return jsonify({"error": "User profile and meal history are required"}), 400

    meal_res = suggest_next_meal(user_profile, meal_history)
    
    return jsonify(meal_res), 200

@api.route('/chat', methods=['POST'])
def ask_qn():
    prompt_qn = request.json.get("prompt")

    msg_response = respond_prompt(prompt=prompt_qn)

    return msg_response

# Route to serve the audio files
@api.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory("../audio", filename)

if __name__ == '__main__':
    app.run(debug=True)
