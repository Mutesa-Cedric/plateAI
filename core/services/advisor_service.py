import re
from config import Config
from groq import Groq

def get_advice(client, recent_meal, user, past_meals):
    first_3_meals = past_meals[:3]
    prompt = (
        f"We have a user ({user}), analyze this user's recent meal ({recent_meal}) and past meals ({first_3_meals})."
        f"In not more than 1.5 lines, provide recommendations for improving the user's diet in relation to their goal/purpose."
        f"In response, make sure to user user's names to make it sound like you know him/her"
        f"Do not include any additional information or explanations."
    )
    
    chat_res = client.chat.completions.create(
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        model="llama3-8b-8192"
    )
    
    return chat_res.choices[0].message.content.strip()


def advisor_service(recent_meal, user, past_meals):
    client = Groq(api_key=Config.GROQ_API_KEY)
    advice = get_advice(client, recent_meal, user, past_meals)
    return {"advice": advice}
