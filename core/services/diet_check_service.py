import base64
import json
import re
from datetime import datetime
from groq import Groq
from config import Config

def diet_check(image_file):
    def encode_image(image_file):
      return base64.b64encode(image_file.read()).decode('utf-8')

    def get_food_items(client, base64_image):
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Return a list of edible food items in an array [ ] with items separated by commas only. No other special characters or text. If no food items are detected, return 'No food content found!'"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            model="llava-v1.5-7b-4096-preview",
        )
        return chat_completion.choices[0].message.content

    def parse_result(result):
        result = result.strip()
        if result.startswith('[') and result.endswith(']'):
            try:
                return json.loads(result)
            except json.JSONDecodeError:
                return []
        return [item.strip().strip('"') for item in result.strip('[]').split(', ')]

    def get_food_metrics(client, food_items):
        food_items_str = ', '.join([f'"{item}"' for item in food_items])
        prompt = f"Please provide an array of objects for the following food items: {food_items_str}. Each object should contain 'food_item', 'calories', 'carbohydrates', 'proteins', 'sodium', and 'fats' as fields. Return the results in JSON format."
        
        chat_res = client.chat.completions.create(
            messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
            model="llava-v1.5-7b-4096-preview",
        )
        return chat_res.choices[0].message.content.strip()

    def extract_json_content(data):
        json_match = re.search(r'(\{.*\}|\[.*\])', data, re.DOTALL)
        return json_match.group(0) if json_match else None

    base64_image = encode_image(image_file)
    client = Groq(api_key=Config.GROQ_API_KEY)

    for _ in range(6):  # Maximum 6 retries
        result = get_food_items(client, base64_image)
        food_items = parse_result(result)

        if food_items and food_items != ["No food content found!"]:
            unique_food_items = list(set(food_items))
            food_metrics = get_food_metrics(client, unique_food_items)
            json_content = extract_json_content(food_metrics)

            if json_content:
                try:
                    return json.loads(json_content)
                except json.JSONDecodeError:
                    continue

    return {"error": "Unable to extract food metrics from the image"}
