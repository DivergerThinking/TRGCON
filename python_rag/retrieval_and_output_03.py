import os

import pinecone
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.prompts import PromptTemplate
from langchain.vectorstores.pinecone import Pinecone

# Load environment variables
load_dotenv()

retrieval_and_output_bp = Blueprint("retrieval_and_output", __name__)

# Prompt QA
QA_PROMPT = (
    "Eres un asistente de inteligencia artificial que indicas una respuesta sobre un documento de texto relacionado con las finanzas de una compañía. "
    + "Se te proporcionan las siguientes partes extraídas de un documento largo y una pregunta. "
    + "Context:{context} "
    + "Question:{question}"
)
QA_PROMPT = PromptTemplate(template=QA_PROMPT, input_variables=["context", "question"])


# Retriever
def make_chain(retriever):
    return RetrievalQA.from_llm(
        llm=ChatOpenAI(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_organization=os.getenv("OPENAI_ORGANIZATION"),
            temperature=0.1,
            model_name="gpt-3.5-turbo",
        ),
        retriever=retriever,
        prompt=QA_PROMPT,
        verbose=False,
    )


# Question prompt
def build_question_prompt():
    template = "La pregunta es la siguiente: {question}."
    return PromptTemplate(template=template, input_variables=["question"])


@retrieval_and_output_bp.route("/", methods=["POST"])
def retrieve_and_output():
    try:
        content = request.get_json()
        if not content or "indexName" not in content or "question" not in content:
            return jsonify(message="indexName and question fields mandatory"), 400

        # Pinecone instance
        pinecone.init(
            api_key=os.getenv("PINECONE_API_KEY"),
            environment=os.getenv("PINECONE_ENVIRONMENT"),
        )

        # Retriever
        vector_store = Pinecone.from_existing_index(
            embedding=OpenAIEmbeddings(), index_name=content["indexName"]
        )
        retriever = vector_store.as_retriever()
        chain = make_chain(retriever)

        # Build question prompt
        question_prompt = build_question_prompt()
        question = question_prompt.format(question=content["question"])

        # Call to OpenAI
        answer = chain.run(question)

        return jsonify(answer=answer), 200

    except Exception as e:
        return jsonify(error=str(e)), 500
