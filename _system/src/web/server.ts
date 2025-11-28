import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from '../core/utils/config.js';
import notesRouter from './routes/notes.js';
import journalsRouter from './routes/journals.js';
import projectsRouter from './routes/projects.js';
import jarvisRouter from './routes/jarvis.js';
import chatsRouter from './routes/chats';
import templatesRouter from './routes/templates';
import telegramRouter from './routes/telegram';

dotenv.config();

const app: Express = express();
const port = config.webPort;

// SECURITY FIX (VULN-004): Configure CORS with allowlist
// Only allow requests from trusted origins to prevent CSRF attacks
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',  // Frontend dev server (Vite)
  'http://localhost:3000',  // Backend dev server
  'http://127.0.0.1:5173',  // Alternative localhost
  'http://127.0.0.1:3000',  // Alternative localhost
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman, curl)
    // In production, you may want to remove this for stricter security
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[SECURITY] CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/auth headers if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json({ limit: '1mb' })); // SECURITY: Limit request body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    vault: config.vaultPath,
  });
});

// API Routes
app.use('/api/notes', notesRouter);
app.use('/api/journals', journalsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/jarvis', jarvisRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/telegram', telegramRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
const host = process.env.WEB_HOST || 'localhost';
app.listen(port, host, () => {
  console.log(`🚀 Pensieve API server running on http://${host}:${port}`);
  console.log(`📂 Vault: ${config.vaultPath}`);
  console.log(`\n📚 API Endpoints:`);
  console.log(`   GET    /health`);
  console.log(`   GET    /api/notes`);
  console.log(`   POST   /api/notes`);
  console.log(`   GET    /api/notes/:id`);
  console.log(`   PUT    /api/notes/:id`);
  console.log(`   DELETE /api/notes/:id`);
  console.log(`   GET    /api/journals`);
  console.log(`   GET    /api/journals/today`);
  console.log(`   GET    /api/journals/stats`);
  console.log(`   GET    /api/projects`);
  console.log(`   POST   /api/projects`);
  console.log(`   POST   /api/jarvis/summarize/:id`);
  console.log(`   POST   /api/jarvis/distill/:id`);
  console.log(`   POST   /api/jarvis/batch-summarize`);
  console.log(`   GET    /api/jarvis/distillation-levels`);
  console.log(`   GET    /api/chats`);
  console.log(`   POST   /api/chats`);
  console.log(`   GET    /api/chats/:id`);
  console.log(`   DELETE /api/chats/:id`);
  console.log(`   POST   /api/chats/:id/messages`);
  console.log(`   GET    /api/templates`);
  console.log(`   GET    /api/templates/:name`);
  console.log(`   GET    /api/templates/:name/instantiate`);
  console.log(`   GET    /api/telegram/unread`);
  console.log(`\nPress Ctrl+C to stop`);
});

export default app;
