import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Webhook proxy endpoint to bypass browser CORS if needed (supports POST and GET for polling)
  app.all('/api/proxy', async (req, res) => {
    const targetUrl = (req.query.url as string) || (req.headers['x-target-url'] as string);
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target webhook URL in query param (?url=...) or x-target-url header' });
    }

    let parsedTarget: URL;
    try {
      parsedTarget = new URL(targetUrl);
      if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
        return res.status(400).json({ error: 'Invalid URL protocol: only http and https are permitted' });
      }
    } catch {
      return res.status(400).json({ error: 'Malformed target webhook URL provided' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const isGet = req.method === 'GET';
      const response = await fetch(targetUrl, {
        method: isGet ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: isGet ? undefined : JSON.stringify(req.body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      return res.status(response.status).json(data);
    } catch (err: any) {
      console.error('Webhook proxy error:', err);
      const isTimeout = err.name === 'AbortError';
      return res.status(isTimeout ? 504 : 502).json({
        error: isTimeout ? 'Webhook request timed out (45s)' : 'Proxy connection failed',
        message: err.message,
      });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
