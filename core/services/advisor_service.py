import re
from config import Config
from groq import Groq

def get_advice(client, recent_meal, user, past_meals):
    prompt = (
        f"We have a user ({user}), analyze this user's recent meal ({recent_meal}) and past meals ({past_meals})."
        f"Give advice in two sections: "
        f"1. Description: Describe the recent meal based on its food items, calories, carbohydrates, proteins, sodium, fats, without listing components."
        f"2. Advice: Provide recommendations for improving the user's diet in relation to their goal/purpose."
        f"Do not include any additional information or explanations."
    )
    
    chat_res = client.chat.completions.create(
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        model="llama3-8b-8192"
    )
    
    return chat_res.choices[0].message.content.strip()


def sanitize_markdown(markdown_text):
    # Remove markdown headers (e.g., # Header)
    markdown_text = re.sub(r'#.*\n', '', markdown_text)
    
    # Remove bold, italic, and other markdown emphasis (e.g., **bold** or *italic*)
    markdown_text = re.sub(r'(\*\*|\*|__|_)(.*?)\1', r'\2', markdown_text)
    
    # Remove inline code or code blocks (e.g., `code` or ```code block```)
    markdown_text = re.sub(r'`([^`]*)`', r'\1', markdown_text)
    markdown_text = re.sub(r'```[\s\S]*?```', '', markdown_text)
    
    # Remove links but keep the link text (e.g., [text](url) -> text)
    markdown_text = re.sub(r'\[(.*?)\]\((.*?)\)', r'\1', markdown_text)
    
    # Remove images (e.g., ![alt text](image url))
    markdown_text = re.sub(r'!\[(.*?)\]\((.*?)\)', '', markdown_text)
    
    # Remove HTML tags if there are any (e.g., <div> -> remove)
    markdown_text = re.sub(r'<[^>]*>', '', markdown_text)
    
    # Replace new lines with <br> for frontend display
    markdown_text = markdown_text.replace('\n', '<br>')
    
    return markdown_text

def advisor_service(recent_meal, user, past_meals):
    client = Groq(api_key=Config.GROQ_API_KEY)
    advice = get_advice(client, recent_meal, user, past_meals)
    return {"advice": sanitize_markdown(advice)}
