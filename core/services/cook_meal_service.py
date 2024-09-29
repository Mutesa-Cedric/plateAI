from groq import Groq
from config import Config
import requests

client = Groq(api_key=Config.GROQ_API_KEY)

def format_meal_history(meal_history):
    return [
        meal['foodItems'] for meal in meal_history
    ]

def build_prompt(user_profile, formatted_meal_history):
    return f"""
    You are a nutrition expert. Based on the following user profile and meal history, strictly provide the next meal to cook in markdown format:

    ### User Profile:
    - Name: {user_profile.get('firstName')} {user_profile.get('lastName')}
    - Age: {user_profile.get('age')}
    - Weight: {user_profile.get('weight')} kg
    - Height: {user_profile.get('height')} cm
    - Gender: {user_profile.get('gender')}
    - Purpose: {user_profile.get('purpose')}

    ### Meal History:
    Last {len(formatted_meal_history)} meals:
    {formatted_meal_history}

    ### Response Format:
    Provide the response in the following format:
    
    ```markdown
    ### Ingredients:
    - Item 1: quantity
    - Item 2: quantity
    
    ### Preparation Instructions:
    1. Step one
    2. Step two

    ### Why this meal?
    <explanation> underline keywords like calories (do not respond with user's name, instead use second-person pronouns), ...
    ```
    
    Please respond strictly in this format.
    """

def format_markdown(markdown_string):
    formatted_md = markdown_string.replace("\\n", "\n").strip()
    
    lines = formatted_md.splitlines()
    start_index = 0
    
    for i, line in enumerate(lines):
        if line.startswith("###") or line.startswith("##"):
            start_index = i
            break
    
    return "\n".join(lines[start_index:])

def generate_one_liner(fmt_res):
    one_liner_prompt = f"""
    Based on the following meal response, generate a one-liner description suitable for image search. No extra commentary or words are needed:

    {fmt_res}

    ### One-liner description:
    """
    
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a creative assistant."},
            {"role": "user", "content": one_liner_prompt}
        ],
        model="llama3-8b-8192",
        temperature=0.5,
        max_tokens=10,
        top_p=1
    )
    
    return response.choices[0].message.content.strip()

def suggest_next_meal(user_profile, meal_history):
    formatted_meal_history = format_meal_history(meal_history)
    prompt = build_prompt(user_profile, formatted_meal_history)

    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a nutrition assistant."},
            {"role": "user", "content": prompt}
        ],
        model="llama3-8b-8192",
        temperature=0.5,
        max_tokens=1024,
        top_p=1
    )

    response_content = response.choices[0].message.content

    fmt_res = format_markdown(response_content)
    one_liner_description = f"{generate_one_liner(fmt_res)} HD food image"

    image_64 = requests.get(f"http://157.173.127.185:4000?topic={one_liner_description}")

    return {"response": fmt_res, "image": image_64.text}
