import express from 'express';
import * as dotenv from 'dotenv';

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server listen on port ${PORT}`);
});