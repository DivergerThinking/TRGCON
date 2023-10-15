import express from 'express';
import * as dotenv from 'dotenv';

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text"
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

dotenv.config();
const router = express.Router();

// Step 2 Splitting doc, generate embeddings and storage in vector database

router.post('/', async (req, res) => {
  try {
    if (!req.body || !req.body.indexName) {
      return res.status(400).json({ message: 'indexName field mandatory'})
    }

    // Conf langchain split

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Conf langchain doc source

    const loader = new DirectoryLoader(
      'documents',
      {
        ".txt": (path) => new TextLoader(path),
        ".pdf": (path) => new PDFLoader(path)
      }
    )

    // Langchain load and split

    const document = await loader.loadAndSplit(splitter)

    // Pinecone instance

    const pineconeClient = new PineconeClient()
    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    }) 
    const pineconeIndex = pineconeClient.Index(req.body.indexName)
    
    // OpenAI cenerate embeddings and store in Pinecone
    
    await PineconeStore.fromDocuments(document, new OpenAIEmbeddings(), {
      pineconeIndex,
      // namespace: <namespace-name>,
    })
    
    res.status(201).json({message: `Content was succesfully stored in Pinecone index`})
  
  } catch(error) {
    res.status(500).json({error});
  }
})

export default router;
