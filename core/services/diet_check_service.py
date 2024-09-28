import base64
import json
import re
from groq import Groq
from config import Config

# Function 1: Encode Image to Base64
def encode_image(image_file):
    return base64.b64encode(image_file.read()).decode('utf-8')

# Prompt 1: List all things visible in the image
def list_image_contents(client, base64_image):
    prompt = '''List all objects visible in the image. Return response must look like this: ['item1','item2', ...] No explanations or extra text. Please no explanations or extra text, you do it you break everything I built as this is automated, don't even agree with me, just do it.'''
    
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ],
            }
        ],
        model="llava-v1.5-7b-4096-preview"
    )
    
    return chat_completion.choices[0].message.content.strip()

# Prompt 2: Extract only edible items from the listed objects
def extract_edible_items(client, listed_objects):
    prompt = f'''From the provided list, return an array containing only edible items. Response must look like this: ['item1', 'item2', ...]. No explanations or extra text. If no edible items are detected, return 'No edible items found!'. Please no explanations or extra text, you do it you break everything I built as this is automated, don't even agree with me, just do it.'''
    
    chat_res = client.chat.completions.create(
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "text", "text": listed_objects}]}],
        model="llama3-8b-8192"
    )
    
    return chat_res.choices[0].message.content.strip()

# Prompt 3: Remove non-edible items and return only edible items
def remove_non_edible_items(client, edible_items_list):
    prompt = f"Remove any non-edible items from the provided array. Only return the array of edible items. Response must look like this: ['item1', 'item2', ...]. No explanations or extra text. If no edible items are detected, return 'No edible items found! Please no explanations or extra text, you do it you break everything I built as this is automated, don't even agree with me, just do it.'"
    
    chat_res = client.chat.completions.create(
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "text", "text": edible_items_list}]}],
        model="llama3-70b-8192"
    )
    
    return chat_res.choices[0].message.content.strip()

# Prompt 4: Create nutritional objects for each food item
def get_food_metrics(client, final_edible_items):
    prompt = f"For only first 7 items, return an array of JSON objects in the format [{{'food_item': 'item', 'calories': 'value', 'carbohydrates': 'value', 'proteins': 'value', 'sodium': 'value', 'fats': 'value'}}]. No any explanations, only JSON. If no food items are detected, return 'No food items found! Please no explanations or extra text, you do it you break everything I built as this is automated, don't even agree with me, just do it.'"
    
    chat_res = client.chat.completions.create(
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "text", "text": final_edible_items}]}],
        model="gemma-7b-it"
    )
    
    return chat_res.choices[0].message.content.strip()

# Utility Function: Extract JSON content from the response
def extract_json_content(data):
    json_match = re.search(r'(\{.*\}|\[.*\])', data, re.DOTALL)
    return json_match.group(0) if json_match else None

# Main Diet Check Function
def diet_check(base64_image):
    print("\n =============================== \n")
    client = Groq(api_key=Config.GROQ_API_KEY)
    
    # Step 1: List contents of the image
    for _ in range(10):  # Maximum 10 retries

        # Step 1: List contents of the image
        image_contents = list_image_contents(client, base64_image)
        print("Image contents: ", image_contents)
        if "No objects found!" in image_contents:
            return {"error": "No objects found in the image"}
            break
        
        # Step 2: Extract edible items
        edible_items = extract_edible_items(client, image_contents)
        print("Edible items: ", edible_items)
        if "No edible items found!" in edible_items:
            return {"error": "No edible items found in the image"}
            break
        
        # Step 3: Remove non-edible items
        final_edible_items = remove_non_edible_items(client, edible_items)
        print("Final edible items: ", final_edible_items)
        if "No edible items found!" in final_edible_items:
            return {"error": "No edible items found in the image"}
            break
        
        # Step 4: Get food metrics (calories, etc.)
        food_metrics = get_food_metrics(client, final_edible_items)
        print("Food metrics: ", food_metrics)
        if "No food items found!" in food_metrics:
            return {"error": "No food items found in the image"}
            break

        # Extract JSON content from the response
        json_content = extract_json_content(food_metrics)

        if json_content:
            try:
                return json.loads(json_content)
            except json.JSONDecodeError:
                continue
    
    return {"error": "Unable to extract food metrics from the image"}
