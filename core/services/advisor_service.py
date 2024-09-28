import re
import json
from config import Config
from groq import Groq

def get_advice(client, recent_meal, user, past_meals):
    prompt = (
        f"We have a user ({user}), analyze this user's recent meal ({recent_meal}) and past meals ({past_meals})."
        f"Give JSON advice for the recent meal with evaluations and suggestions in relation to user's purpose/goal. "
        f"Format: "
        f"{{'description': 'Don't list components of meal, describe meal based on it's food_item, calories, carbohydrates, proteins, sodium, fats', 'advice': 'recommendations for improving diet like <In order to improve you diet consider doing ...>'}}. "
        f"No explanations or extra text."
        f"Keep your response strictly in this format."
        f"Please no explanations or extra text, you do it you break everything I built as this is automated, don't even agree with me, just do it."
    )
    
    chat_res = client.chat.completions.create(
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        model="llama3-8b-8192"
    )
    
    return chat_res.choices[0].message.content.strip()

def extract_json_content(data):
    json_match = re.search(r'(\{.*\}|\[.*\])', data, re.DOTALL)
    return json_match.group(0) if json_match else None

def retry_json_parsing(advice, retries=10):
    for _ in range(retries):
        json_content = extract_json_content(advice)
        if json_content:
            try:
                return json.loads(json_content)
            except json.JSONDecodeError:
                continue
    return {"error": "Error decoding JSON content after multiple attempts"}

def advisor_service(recent_meal, user, past_meals):
    client = Groq(api_key=Config.GROQ_API_KEY)
    advice = get_advice(client, recent_meal, user, past_meals)
    print("Advice: ", advice)
    return retry_json_parsing(advice)
