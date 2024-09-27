from flask import Flask
from routes.api_routes import api
from config import Config

app = Flask(__name__)

app.register_blueprint(api)

if __name__ == '__main__':
    app.run(debug=Config.DEBUG)
