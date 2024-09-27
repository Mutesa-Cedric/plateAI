import base64
import re
import json
from groq import Groq

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
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

def process_result(result):
    return re.sub(r'(\w+):', r'\1:', result)

def parse_json_array(data):
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        print("Error decoding JSON. Result was:", data)
        return []

def parse_plain_list(data):
    return [item.strip().strip('"') for item in data.strip('[]').split(', ')]

def unique_items(items):
    unique_list = []
    for item in items:
        if item not in unique_list:
            unique_list.append(item)
    return unique_list

def parse_result(processed_result):
    processed_result = processed_result.strip()
    print(f"Processed Result: {processed_result}")
    if processed_result.startswith('[') and processed_result.endswith(']'):
        return parse_json_array(processed_result)
    else:
        return parse_plain_list(processed_result)

def get_food_metrics(client, food_items):
    food_items_str = ', '.join([f'"{item}"' for item in food_items])
    print(f"Food Items String: {food_items_str}")
    
    if len(food_items) == 1:
        prompt = f"Please provide an object for the food item: {food_items_str}. Include 'food_item', 'calories', 'carbohydrates', 'proteins', 'sodium', and 'fats' as fields. Return the result in JSON format."
    else:
        prompt = f"Please provide an array of objects for the following food items: {food_items_str}. Each object should contain 'food_item', 'calories', 'carbohydrates', 'proteins', 'sodium', and 'fats' as fields. Return the results in JSON format."
    
    chat_res = client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": [{
                "type": "text",
                "text": prompt
            }],
        }],
        model="llava-v1.5-7b-4096-preview",
    )
    
    return chat_res.choices[0].message.content


image_path = "sample.png"
base64_image = encode_image(image_path)

client = Groq(api_key="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")

retry_count = 0
max_retries = 6

while retry_count < max_retries:
    result = get_food_items(client, base64_image)
    processed_result = process_result(result)
    
    print(f"Result from get_food_items: {result}")
    print(f"Processed Result: {processed_result}")
    
    if processed_result != "No food content found!":
        food_items_list = parse_result(processed_result)
        unique_food_items = unique_items(food_items_list)

        print(f"Unique Food Items: {unique_food_items}")

        if unique_food_items:
            food_metrics = get_food_metrics(client, unique_food_items)
            
            print(f"Food Metrics: {food_metrics}")
            break

    retry_count += 1
