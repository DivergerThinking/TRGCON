import express from 'express';
import * as dotenv from 'dotenv';

import documentLoading from './01-document-loading/01-document-loading.js';
import splittingAndStorage from './02-splitting-and-storage/02-splitting-and-storage.js';
import retrievalAndOutput from './03-retrieval-and-output/03-retrieval-and-output.js';

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();
app.use(express.json());

app.use('/document-loading', documentLoading);
app.use('/splitting-and-storage', splittingAndStorage);
app.use('/retrieval-and-output', retrievalAndOutput);

app.listen(PORT, () => {
  console.log(`Server listen on port ${PORT}`);
});