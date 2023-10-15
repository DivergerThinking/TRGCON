import express from 'express';
import * as dotenv from 'dotenv';

import multer from 'multer';
import { PineconeClient } from "@pinecone-database/pinecone";

dotenv.config();
const router = express.Router();

// Step 1 Store doc source in server folder and create Pinecone index

// Multer middleware conf for storage content

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'documents');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const whitelist = [
  'text/plain',
  'application/pdf',
]

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (!file || !whitelist.includes(file.mimetype)) {
      cb(null, false);
      return cb(new Error('Please upload a .txt or .pdf file'));
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }
}).single('file');

// Pinecone client instance

const pineconeClient = new PineconeClient()
await pineconeClient.init({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
})

router.post('/', (req, res) => {
  upload(req, res, async (multerError) => {
    try {  
      if (multerError) {
        return res.status(400).json({error: multerError.message})
      }

      // Pinecone index creation after multer storage

      const indexName = req.file.originalname.split('.').slice(0, -1).join('.').replace(/[\W_]+/g, '').toLowerCase();
      const vectorDimension = 1536;

      const indexesList = await pineconeClient.listIndexes();
      if (indexesList.includes(indexName)) {
        return res.status(204).json({ message: 'Pinecone index already exists'})
      }
      await pineconeClient.createIndex({
        createRequest: {
          name: indexName,
          dimension: vectorDimension,
          metric: 'cosine',
        }
      })

      res.status(201).json({message: `Pinecone index was succesfully created for ${indexName} content`})
    } catch (error) {
      res.status(500).json({error});
    }
  })
})

export default router;

