from config import Config
from groq import Groq
from cache import cached_get_or_set
from payloads import advisor_key_material

def get_advice(client, recent_meal, user, past_meals):
    # past_meals is already trimmed to the first 3 used by the prompt.
    prompt = (
        f"We have a user ({user}), analyze this user's recent meal ({recent_meal}) and past meals ({past_meals})."
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
    material = advisor_key_material(recent_meal, user, past_meals)

    def _produce():
        client = Groq(api_key=Config.GROQ_API_KEY)
        advice = get_advice(
            client,
            material["recent_meal"],
            material["user"],
            material["past_meals"],
        )
        return {"advice": advice}

    return cached_get_or_set("advisor", material, _produce)
