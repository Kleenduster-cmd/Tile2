import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// API route for AI texture generation
app.post('/api/generate-texture', async (req: Request, res: Response) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'GEMINI_API_KEY not configured on server' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert 16-bit RPG pixel artist. Generate a 32x32 pixel art seamless base terrain texture for: "${prompt}".
Output JSON only with a single key "hexMatrix" containing an array of 32 rows, each row containing 32 hex color strings (e.g. ["#3d992a", ...]).
Keep colors cohesive (max 6-8 distinct colors like real retro pixel art).`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.hexMatrix && Array.isArray(parsed.hexMatrix) && parsed.hexMatrix.length >= 16) {
      res.json({ hexMatrix: parsed.hexMatrix });
      return;
    }
    res.status(502).json({ error: 'Invalid matrix structure from model' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate texture';
    console.error('Gemini texture generation error:', message);
    res.status(500).json({ error: message });
  }
});

// Serve frontend with Vite in dev, or static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true, host: HOST, port: PORT },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
