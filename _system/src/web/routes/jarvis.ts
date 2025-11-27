import { Router, Request, Response } from 'express';
import { JarvisService } from '../../core/services/JarvisService';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

/**
 * POST /api/jarvis/summarize/:id
 * Summarize a single note with JARVIS
 *
 * Request body:
 * {
 *   language: 'en' | 'zh',  // Default: 'en'
 *   voice: boolean          // Default: false
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     summary: string,
 *     audioPlayed: boolean
 *   }
 * }
 */
router.post('/summarize/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { language = 'en', voice = false } = req.body;

    if (!['en', 'zh'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: "Language must be 'en' or 'zh'",
      });
    }

    const result = await JarvisService.summarizeNote(id, language, voice);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Summarize error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to summarize note',
    });
  }
});

/**
 * POST /api/jarvis/distill/:id
 * Progress note to next distillation level with JARVIS guidance
 *
 * Request body:
 * {
 *   targetLevel: number,     // 0-4
 *   language: 'en' | 'zh',   // Default: 'en'
 *   voice: boolean           // Default: false
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: Note (updated with new distillation level)
 * }
 */
router.post('/distill/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetLevel, language = 'en', voice = false } = req.body;

    if (typeof targetLevel !== 'number' || targetLevel < 0 || targetLevel > 4) {
      return res.status(400).json({
        success: false,
        error: 'targetLevel must be a number between 0 and 4',
      });
    }

    if (!['en', 'zh'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: "Language must be 'en' or 'zh'",
      });
    }

    const updatedNote = await JarvisService.distillNote(
      id,
      targetLevel,
      language,
      voice
    );

    res.json({
      success: true,
      data: updatedNote,
    });
  } catch (error: any) {
    console.error('Distill error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to distill note',
    });
  }
});

/**
 * POST /api/jarvis/batch-summarize
 * Batch summarize multiple notes with Server-Sent Events for progress
 *
 * Request body:
 * {
 *   noteIds: string[],
 *   language: 'en' | 'zh',  // Default: 'en'
 *   voice: boolean          // Default: false
 * }
 *
 * Response: SSE stream
 * Events:
 * - data: { type: 'progress', current: number, total: number, noteId: string }
 * - data: { type: 'result', noteId: string, summary: string, error?: string }
 * - data: { type: 'complete', results: Array }
 */
router.post('/batch-summarize', async (req: Request, res: Response) => {
  try {
    const { noteIds, language = 'en', voice = false } = req.body;

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'noteIds must be a non-empty array',
      });
    }

    if (!['en', 'zh'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: "Language must be 'en' or 'zh'",
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Progress callback
    const onProgress = (current: number, total: number, noteId: string) => {
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          current,
          total,
          noteId,
        })}\n\n`
      );
    };

    // Execute batch summarization
    const results = await JarvisService.batchSummarize(
      noteIds,
      language,
      voice,
      onProgress
    );

    // Send individual results
    for (const result of results) {
      res.write(
        `data: ${JSON.stringify({
          type: 'result',
          ...result,
        })}\n\n`
      );
    }

    // Send completion event
    res.write(
      `data: ${JSON.stringify({
        type: 'complete',
        results,
      })}\n\n`
    );

    res.end();
  } catch (error: any) {
    console.error('Batch summarize error:', error);

    // Send error event
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: error.message || 'Batch summarization failed',
      })}\n\n`
    );

    res.end();
  }
});

/**
 * GET /api/jarvis/distillation-levels
 * Get information about all distillation levels
 *
 * Response:
 * {
 *   success: true,
 *   data: [
 *     { level: 0, name: 'Raw Capture', description: '...' },
 *     ...
 *   ]
 * }
 */
router.get('/distillation-levels', (req: Request, res: Response) => {
  try {
    const levels = [0, 1, 2, 3, 4].map((level) => ({
      level,
      ...JarvisService.getDistillationLevelInfo(level),
    }));

    res.json({
      success: true,
      data: levels,
    });
  } catch (error: any) {
    console.error('Get distillation levels error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get distillation levels',
    });
  }
});

/**
 * POST /api/jarvis/speak
 * Play text via Google Cloud TTS without generating summary
 *
 * Request body:
 * {
 *   text: string,
 *   language: 'en' | 'zh'  // Default: 'en'
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     played: boolean
 *   }
 * }
 */
router.post('/speak', async (req: Request, res: Response) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    if (!['en', 'zh'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: "Language must be 'en' or 'zh'",
      });
    }

    // SECURITY FIX: Validate input before processing
    try {
      // Max length validation
      if (text.length > 10000) {
        return res.status(400).json({
          success: false,
          error: 'Text too long (max 10000 characters)',
        });
      }

      // Control character validation
      if (/[\x00-\x1F\x7F]/.test(text)) {
        return res.status(400).json({
          success: false,
          error: 'Text contains invalid control characters',
        });
      }

      const langCode = language === 'en' ? 'en-GB' : 'cmn-TW';
      const scriptPath = path.resolve(__dirname, '../../../script/google_tts.sh');

      // SECURITY FIX: Use spawn() with argument array instead of template string
      // No escaping needed - arguments are passed directly without shell interpretation
      const played = await new Promise<boolean>((resolve) => {
        const proc = spawn(scriptPath, [text, langCode], {
          timeout: 30000
        });

        let stderr = '';

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            console.error('TTS playback failed with code:', code, 'stderr:', stderr);
            resolve(false);
          }
        });

        proc.on('error', (error) => {
          console.error('TTS playback error:', error);
          resolve(false);
        });
      });

      res.json({
        success: true,
        data: {
          played,
        },
      });
    } catch (ttsError: any) {
      // TTS failed but don't return 500 - log and return success: false
      console.error('TTS playback error:', ttsError.message);
      res.json({
        success: false,
        error: ttsError.message || 'TTS playback failed',
        data: {
          played: false,
        },
      });
    }
  } catch (error: any) {
    console.error('TTS speak error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to play text via TTS',
    });
  }
});

export default router;
