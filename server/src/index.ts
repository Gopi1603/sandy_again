import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import recipesRouter from './routes/recipes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/recipes', recipesRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
