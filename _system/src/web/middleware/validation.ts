import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware using Zod schemas
 *
 * Protects against:
 * - Type coercion attacks (CWE-843)
 * - Invalid input types
 * - Missing required fields
 * - Out-of-range values
 */

/**
 * Create validation middleware for request body
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Create validation middleware for URL parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Common validation schemas
 */

// Note ID validation
export const noteIdSchema = z.object({
  id: z.string()
    .min(1, 'Note ID is required')
    .max(50, 'Note ID too long')
    .regex(/^[0-9]+$/, 'Note ID must be numeric timestamp'),
});

// PARA folder validation
export const paraFolderSchema = z.enum(['inbox', 'projects', 'areas', 'resources', 'archive', 'people']);

// Tag validation
export const tagSchema = z.string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Tag must be alphanumeric with dash/underscore');

// Note creation schema
export const createNoteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long (max 200 characters)'),
  content: z.string()
    .max(1000000, 'Content too long (max 1MB)'), // 1MB limit
  tags: z.array(tagSchema)
    .max(20, 'Too many tags (max 20)')
    .optional()
    .default([]),
  isInspiring: z.boolean().optional().default(false),
  isUseful: z.boolean().optional().default(false),
  isPersonal: z.boolean().optional().default(false),
  isSurprising: z.boolean().optional().default(false),
  folder: paraFolderSchema.optional(),
  subPath: z.string()
    .max(200, 'Path too long (max 200 characters)')
    .optional(),
});

// Note update schema
export const updateNoteSchema = z.object({
  content: z.string()
    .max(1000000, 'Content too long (max 1MB)')
    .optional(),
  tags: z.array(tagSchema)
    .max(20, 'Too many tags (max 20)')
    .optional(),
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title too long (max 200 characters)')
    .optional(),
});

// Note move schema
export const moveNoteSchema = z.object({
  folder: paraFolderSchema,
  subPath: z.string()
    .max(200, 'Path too long (max 200 characters)')
    .optional(),
});

// Journal entry schema
export const createJournalSchema = z.object({
  content: z.string()
    .max(100000, 'Content too long (max 100KB)'),
  mood: z.string()
    .max(50, 'Mood too long')
    .optional(),
  energyLevel: z.number()
    .int('Energy level must be an integer')
    .min(1, 'Energy level must be at least 1')
    .max(10, 'Energy level must be at most 10')
    .optional(),
  habitsCompleted: z.array(z.string().max(50))
    .max(20, 'Too many habits')
    .optional(),
  gratitude: z.array(z.string().max(200))
    .max(10, 'Too many gratitude items')
    .optional(),
});

// Journal query schema
export const journalQuerySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  year: z.string()
    .regex(/^\d{4}$/, 'Year must be 4 digits')
    .optional(),
  month: z.string()
    .regex(/^\d{2}$/, 'Month must be 2 digits')
    .optional(),
});

// Project creation schema
export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Project name must be alphanumeric with dash/underscore'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  goal: z.string()
    .max(1000, 'Goal too long')
    .optional(),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional(),
  tags: z.array(tagSchema)
    .max(20, 'Too many tags')
    .optional(),
});

// Project progress update schema
export const updateProgressSchema = z.object({
  progress: z.number()
    .int('Progress must be an integer')
    .min(0, 'Progress must be at least 0')
    .max(100, 'Progress must be at most 100'),
});

// JARVIS summarize schema
export const summarizeNoteSchema = z.object({
  language: z.enum(['en', 'zh']).optional().default('en'),
  voice: z.boolean().optional().default(false),
});

// JARVIS distill schema
export const distillNoteSchema = z.object({
  targetLevel: z.number()
    .int('Target level must be an integer')
    .min(0, 'Target level must be at least 0')
    .max(4, 'Target level must be at most 4'),
  language: z.enum(['en', 'zh']).optional().default('en'),
  voice: z.boolean().optional().default(false),
});

// JARVIS batch summarize schema
export const batchSummarizeSchema = z.object({
  noteIds: z.array(z.string().regex(/^[0-9]+$/))
    .min(1, 'At least one note ID is required')
    .max(50, 'Too many notes (max 50)'),
  language: z.enum(['en', 'zh']).optional().default('en'),
  voice: z.boolean().optional().default(false),
});

// JARVIS speak schema
export const speakSchema = z.object({
  text: z.string()
    .min(1, 'Text is required')
    .max(10000, 'Text too long (max 10000 characters)'),
  language: z.enum(['en', 'zh']).optional().default('en'),
});

// Chat creation schema
export const createChatSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long'),
  agent: z.enum(['jarvis-en', 'jarvis-zh', 'voice-discussion']).optional(),
});

// Chat message schema
export const chatMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message content is required')
    .max(10000, 'Message too long (max 10000 characters)'),
});
