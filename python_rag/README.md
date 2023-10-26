# NodeJS RAG Template

## Install dependencies

```bash
pip install -r requirements.txt
```

## Create a .env file and set .env keys

```.env
PORT=3000
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_ENVIRONMENT=<your-pinecone-environment>
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_ORGANIZATION=<your-openai-organization>
```

## Execute app

```bash
flask --app index run
```
