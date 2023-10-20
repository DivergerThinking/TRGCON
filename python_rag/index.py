from flask import Flask
from dotenv import load_dotenv
from os import getenv

# import scripts here
from document_loading_01 import document_loading_bp
from splitting_and_storage_02 import splitt_and_store_bp
from retrieval_and_output_03 import retrieval_and_output_bp

# Create main Flask app
app = Flask(__name__)
load_dotenv()
PORT = getenv("PORT") or 3000

app.register_blueprint(document_loading_bp, url_prefix="/document-loading")
app.register_blueprint(splitt_and_store_bp, url_prefix="/splitting-and-storage")
app.register_blueprint(retrieval_and_output_bp, url_prefix="/retrieval-and-output")

if __name__ == "__main__":
    app.run(port=PORT)
