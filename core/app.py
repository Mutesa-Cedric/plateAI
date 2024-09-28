from flask import Flask, render_template_string
from routes.api_routes import api
from config import Config

app = Flask(__name__)

app.register_blueprint(api)

endpoints = [
    {
        "endpoint": "/",
        "description": "Entry Point",
        "method": "GET"
    },
    {
        "endpoint": "/tts",
        "description": "Text-to-Speech",
        "method": "POST"
    },
    {
        "endpoint": "/stt",
        "description": "Speech-to-Text",
        "method": "POST"
    },
    {
        "endpoint": "/diet-check",
        "description": "Diet Check",
        "method": "POST"
    },
    {
        "endpoint": "/cook-for-me",
        "description": "Generate Next Meal",
        "method": "POST"
    },
    {
        "endpoint": "/advisor",
        "description": "Analysis and Advice",
        "method": "POST"
    },
    {
        "endpoint": "/chat",
        "description": "Chat",
        "method": "POST"
    }
]

@app.get('/')
def index_route():
    html_content = """
    <html>
        <head>
            <title>API Endpoints</title>
        </head>
        <body>
            <h1>Available API Endpoints</h1>
            <ul>
                {% for endpoint in endpoints %}
                    <li>
                        <a href="{{ endpoint['endpoint'] }}">{{ endpoint['endpoint'] }}</a>
                        <p>{{ endpoint['description'] }} (Method: {{ endpoint['method'] }})</p>
                    </li>
                {% endfor %}
            </ul>
        </body>
    </html>
    """
    
    return render_template_string(html_content, endpoints=endpoints)

if __name__ == '__main__':
    app.run(debug=Config.DEBUG)
