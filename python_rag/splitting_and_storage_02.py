import os

import pinecone
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from langchain.document_loaders import DirectoryLoader, PyPDFLoader, TextLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores.pinecone import Pinecone

# Load environment variables
load_dotenv()

if not os.getenv("PINECONE_API_KEY"):
    raise Exception("Enviroment variable PINECONE_API_KEY not set.")
if not os.getenv("PINECONE_ENVIRONMENT"):
    raise Exception("Enviroment variable PINECONE_ENVIRONMENT not set.")

splitt_and_store_bp = Blueprint("splitt_and_store", __name__)


@splitt_and_store_bp.route("/", methods=["POST"])
def process_document():
    """Split document and loading into pinecone index. Caveats:
    - The request endpoint must have the final slash (i.e. .../splitting-and-storage/)
    - The "indexName" must be in the request body as a raw JSON (e.g. {"indexName": "yourindexname"})
    """
    try:
        content = request.get_json()
        if not content or "indexName" not in content:
            return jsonify(message="indexName field mandatory"), 400

        # Config langchain split
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

        # Config langchain doc source
        loaders = {".txt": TextLoader, ".pdf": PyPDFLoader}
        loader = DirectoryLoader("./python_rag/documents/", loader_kwargs=loaders)

        # Langchain load and split
        document = loader.load_and_split(splitter)

        # Pinecone instance
        pinecone.init(
            api_key=os.getenv("PINECONE_API_KEY"),
            environment=os.getenv("PINECONE_ENVIRONMENT"),
        )

        # OpenAI generate embeddings and store in Pinecone
        Pinecone.from_documents(
            document, OpenAIEmbeddings(), index_name=content["indexName"]
        )

        return jsonify(message="Content was successfully stored in Pinecone index"), 201

    except Exception as e:
        return jsonify(error=str(e)), 500
