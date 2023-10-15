import express from 'express';
import * as dotenv from 'dotenv';

import { ConversationalRetrievalQAChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone"
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

dotenv.config();
const router = express.Router();

// Step 3 Q&A from retrieval and request to OpenAI LLM

// Prompt QA

const QA_PROMPT= `Eres un asistente de inteligencia artificial que indicas una respuesta sobre un documento de texto relacionado con las finanzas de una compañía.
Se te proporcionan las siguientes partes extraídas de un documento largo y una pregunta.
Context:{context}
Question:{question}`

// Retriever

const makeChain = (
  retriever
) => {
  return ConversationalRetrievalQAChain.fromLLM(
    new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.1,
      modelName: 'gpt-3.5-turbo',
    }),
    retriever,
    {
      qaTemplate: QA_PROMPT,
      verbose: false,
    }
  )
}

// Question prompt

const buildQuestionPrompt = () => {
  const template =`La pregunta es la siguiente: {question}.`
  const Prompt = new PromptTemplate({
    template,
    inputVariables: [ 'question' ]
  })
  return Prompt
}

router.post('/', async (req, res) => {
  try {
    if (!req.body || !req.body.indexName || !req.body.question) {
      return res.status(400).json({ message: 'indexName and question fields mandatory'})
    }

    // Pinecone instance

    const client = new PineconeClient()
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    })
    const index = client.Index(req.body.indexName)

    // Retriever

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { 
        pineconeIndex: index, 
        filter: {} 
      }
    );
    const retriever = vectorStore.asRetriever();
    const chain = await makeChain(retriever);

    // Build question prompt

    const questionPrompt = buildQuestionPrompt();
    const question = await questionPrompt.format({
      question: req.body.question,
    })

    // Call to OpenAI

    const answer = await chain.call({ question, chat_history: [] });

    res.status(200).json({answer})
  
  } catch(error) {
    res.status(500).json({error});
  }
})

export default router;