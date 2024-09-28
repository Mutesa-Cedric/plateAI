import base64
import re
import json
from datetime import datetime
from groq import Groq

def load_blacklist(file_path="blacklist.txt"):
    with open(file_path, "r") as file:
        return {line.strip().lower() for line in file if line.strip()}

blacklist = load_blacklist()

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
        return []

def parse_plain_list(data):
    return [item.strip().strip('"') for item in data.strip('[]').split(', ')]

def unique_items(items):
    edible_items = []
    for item in set(items):
        if not any(blacklisted_item in item.lower() for blacklisted_item in blacklist):
            edible_items.append(item)
    return edible_items

def parse_result(processed_result):
    processed_result = processed_result.strip()
    if processed_result.startswith('[') and processed_result.endswith(']'):
        return parse_json_array(processed_result)
    else:
        return parse_plain_list(processed_result)

def get_food_metrics(client, food_items):
    food_items_str = ', '.join([f'"{item}"' for item in food_items])
    if len(food_items) == 1:
        prompt = f"Please provide an object for the food item: {food_items_str}. Include 'food_item', 'calories', 'carbohydrates', 'proteins', 'sodium', and 'fats' as fields. Return the result in JSON format."
    else:
        prompt = f"Please provide an array of objects for the following food items: {food_items_str}. Each object should contain 'food_item', 'calories', 'carbohydrates', 'proteins', 'sodium', and 'fats' as fields. Return the results in JSON format."
    
    chat_res = client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": [{"type": "text", "text": prompt}],
        }],
        model="llava-v1.5-7b-4096-preview",
    )
    return chat_res.choices[0].message.content

def format_metrics_to_json(food_metrics):
    prompt = f"Convert the following food metrics to a JSON object without any additional comments or metrics:\n\n{food_metrics}\n\nReturn only the JSON object."
    
    chat_res = client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": [{"type": "text", "text": prompt}],
        }],
        model="llama3-70b-8192",
    )
    return chat_res.choices[0].message.content.strip()

def save_json_to_file(json_data):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"food_metrics_{timestamp}.json"
    with open(filename, "w") as json_file:
        json.dump(json_data, json_file, indent=4)

def extract_json_content(data):
    json_match = re.search(r'(\{.*\}|\[.*\])', data, re.DOTALL)
    if json_match:
        return json_match.group(0)
    return None

image_path = "sample.jpg"
base64_image = encode_image(image_path)

client = Groq(api_key="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")

retry_count = 0
max_retries = 6

while retry_count < max_retries:
    result = get_food_items(client, base64_image)
    processed_result = process_result(result)

    if "No food content found" not in processed_result:
        food_items_list = parse_result(processed_result)
        unique_food_items = unique_items(food_items_list)

        if not unique_food_items:
            print("No food content found!")
            break

        food_metrics = get_food_metrics(client, unique_food_items)
        structured_metrics = format_metrics_to_json(food_metrics)

        json_content = extract_json_content(structured_metrics)
        if json_content:
            try:
                parsed_json = json.loads(json_content)
                save_json_to_file(parsed_json)
                print("Food metrics saved to JSON file.")
                break
            except json.JSONDecodeError:
                retry_count += 1
        else:
            retry_count += 1

    retry_count += 1
