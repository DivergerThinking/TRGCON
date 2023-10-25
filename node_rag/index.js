import express from 'express';
import * as dotenv from 'dotenv';

import documentLoading from './01-document-loading/01-document-loading.js';

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();
app.use(express.json());

app.use('/document-loading', documentLoading);

app.listen(PORT, () => {
  console.log(`Server listen on port ${PORT}`);
});