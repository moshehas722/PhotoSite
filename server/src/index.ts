import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { photosRouter } from './routes/photos';
import { foldersRouter } from './routes/folders';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/photos', photosRouter);
app.use('/api/folders', foldersRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
