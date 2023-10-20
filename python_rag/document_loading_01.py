import os

import pinecone
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv()

# Define allowed extensions
ALLOWED_EXTENSIONS = {"txt", "pdf"}

# Pinecone client instance
pinecone.init(
    api_key=os.getenv("PINECONE_API_KEY"), environment=os.getenv("PINECONE_ENVIRONMENT")
)

document_loading_bp = Blueprint("document_loading", __name__)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@document_loading_bp.route("/", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify(error="No file part"), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify(error="No selected file"), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join("./python_rag/documents/", filename))

        try:
            index_name = os.path.splitext(file.filename)[0].replace("_", "").lower()
            vector_dimension = 1536

            indexes_list = pinecone.list_indexes()
            if index_name in indexes_list:
                return jsonify(message="Pinecone index already exists"), 204
            pinecone.create_index(
                name=index_name, metric="cosine", dimension=vector_dimension
            )

            return (
                jsonify(
                    message=f"Pinecone index was successfully created for {index_name} content"
                ),
                201,
            )

        except Exception as e:
            return jsonify(error=str(e)), 500
    else:
        return jsonify(error="Please upload a .txt or .pdf file"), 400
