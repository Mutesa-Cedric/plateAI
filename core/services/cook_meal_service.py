from groq import Groq
import torch
from diffusers import FluxPipeline
from huggingface_hub import login
import os
from dotenv import load_dotenv
import base64

load_dotenv()

login(token=os.environ.get("HUGGINGFACE_KEY"))

client = Groq()
pipe = FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-dev", torch_dtype=torch.bfloat16)
pipe.enable_model_cpu_offload()

def encode_image(image_file):
    return base64.b64encode(image_file.read()).decode('utf-8')

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

def formulate_prompt(markdown_res):
    response = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"Based on the following markdown, generate a one-sentence prompt for an image generation model: {markdown_res}. Return only this sentence prompt, no additional commentary."
            }
        ]
    )
    return response.choices[0].message.content


def generate_meal_repr(prompt):
    image = pipe(
        prompt,
        height=1024,
        width=1024,
        guidance_scale=3.5,
        num_inference_steps=50,
        max_sequence_length=512,
        generator=torch.Generator("cpu").manual_seed(0)
    ).images[0]

    image.save("meal_prep.png")
    return encode_image("meal_prep.png")

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
    img_prompt = formulate_prompt(fmt_res)

    img_64 = generate_meal_repr(img_prompt)

    return {"response": fmt_res, "meal_image": img_64}
