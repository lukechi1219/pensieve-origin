import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from '../core/utils/config.js';
import notesRouter from './routes/notes.js';
import journalsRouter from './routes/journals.js';
import projectsRouter from './routes/projects.js';
import jarvisRouter from './routes/jarvis.js';
import chatsRouter from './routes/chats.js';

dotenv.config();

const app: Express = express();
const port = config.webPort;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.listen(port, () => {
  console.log(`🚀 Pensieve API server running on http://localhost:${port}`);
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
  console.log(`\nPress Ctrl+C to stop`);
});

export default app;
