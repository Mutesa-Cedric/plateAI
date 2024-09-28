from groq import Groq
from config import Config

client = Groq(api_key=Config.GROQ_API_KEY)

def respond_prompt(prompt):
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are an expert in food nutrition and healthy eating."
            },
            {
                "role": "user",
                "content": f"{prompt} Please respond in a conversational style as if you are having a concise discussion."
            }
        ],

        model="llama3-8b-8192",
        temperature=0.7,
        max_tokens=1024,
        top_p=1,
        stop=None,
        stream=False,
    )

    msg_report = chat_completion.choices[0].message.content

    return {"response": msg_report}


