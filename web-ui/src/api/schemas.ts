import { z } from 'zod';

/**
 * API Response Validation Schemas
 *
 * These schemas validate API responses at runtime to prevent crashes
 * from unexpected response formats.
 */

// Base response wrapper used by many endpoints
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
  });

// Optional error response
export const ApiErrorSchema = z.object({
  success: z.boolean(),
  error: z.string(),
});

// Chat schemas
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string().optional(),
});

export const ChatSchema = z.object({
  id: z.string(),
  title: z.string(),
  messages: z.array(ChatMessageSchema),
  created: z.string(),
  modified: z.string(),
  tags: z.array(z.string()).optional(),
});

export const ChatListResponseSchema = ApiResponseSchema(
  z.object({
    items: z.array(ChatSchema),
    total: z.number(),
  })
);

export const ChatStatsSchema = z.object({
  totalChats: z.number(),
  totalMessages: z.number(),
  avgMessagesPerChat: z.number(),
  recentChats: z.number(),
});

export const ChatStatsResponseSchema = ApiResponseSchema(ChatStatsSchema);

export const SingleChatResponseSchema = ApiResponseSchema(ChatSchema);

// Distillation Entry schema
export const DistillationEntrySchema = z.object({
  level: z.number(),
  date: z.string(),
  type: z.string(),
  summary: z.string().optional(),
});

// Note schemas
export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  created: z.string(),
  modified: z.string(),
  tags: z.array(z.string()),
  filePath: z.string().optional(),
  paraFolder: z.enum(['inbox', 'projects', 'areas', 'resources', 'archive']).optional(),
  paraPath: z.string().optional(),
  distillationLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  distillationHistory: z.array(DistillationEntrySchema),
  isInspiring: z.boolean(),
  isUseful: z.boolean(),
  isPersonal: z.boolean(),
  isSurprising: z.boolean(),
  status: z.enum(['active', 'archived', 'draft']),
});

export const NoteListResponseSchema = z.object({
  count: z.number(),
  notes: z.array(NoteSchema),
});

export const CreateNoteResponseSchema = z.object({
  message: z.string(),
  note: NoteSchema,
});

// Journal schemas
export const JournalSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.literal('journal'),
  date: z.string(),
  tags: z.array(z.string()),
  mood: z.string().optional(),
  energyLevel: z.number().optional(),
  sleepQuality: z.number().optional(),
  habitsCompleted: z.array(z.string()),
  gratitude: z.array(z.string()),
  filePath: z.string().optional(),
});

export const JournalListResponseSchema = z.object({
  count: z.number(),
  journals: z.array(JournalSchema),
});

export const JournalStatsSchema = z.object({
  totalEntries: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  averageEnergyLevel: z.number(),
  mostCommonMood: z.string(),
  totalHabitsCompleted: z.number(),
});

export const StreakResponseSchema = z.object({
  current_streak: z.number(),
  longest_streak: z.number(),
});

// Project schemas
export const MilestoneSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  completed: z.boolean(),
  completed_date: z.string().optional(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  created: z.string().optional(),
  deadline: z.string().optional(),
  completionDate: z.string().nullable().optional(),
  status: z.enum(['active', 'completed', 'on-hold', 'archived']),
  goal: z.string().optional(),
  successCriteria: z.array(z.string()).optional(),
  relatedAreas: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  progress: z.object({
    percentComplete: z.number(),
    lastUpdated: z.string(),
    milestones: z.array(MilestoneSchema),
  }),
  archive: z.object({
    archived: z.boolean(),
    archive_date: z.string().nullable(),
    archive_reason: z.string(),
    lessons_learned: z.string(),
  }),
  path: z.string().optional(),
  folder_path: z.string().optional(),
});

export const ProjectListResponseSchema = z.object({
  count: z.number(),
  projects: z.array(ProjectSchema),
});

// JARVIS schemas
export const SummarizeResponseSchema = z.object({
  summary: z.string(),
  audioPlayed: z.boolean(),
});

export const SummarizeApiResponseSchema = ApiResponseSchema(SummarizeResponseSchema);

export const DistillationLevelSchema = z.object({
  level: z.number(),
  name: z.string(),
  description: z.string(),
});

export const DistillationLevelsResponseSchema = ApiResponseSchema(
  z.array(DistillationLevelSchema)
);

export const DistillNoteResponseSchema = ApiResponseSchema(NoteSchema);

export const SpeakResponseSchema = z.object({
  played: z.boolean(),
});

export const SpeakApiResponseSchema = ApiResponseSchema(SpeakResponseSchema);

/**
 * Validation helper function
 * Validates response data against a Zod schema
 *
 * @param data - Raw response data from API
 * @param schema - Zod schema to validate against
 * @param context - Context string for error messages (e.g., "chats.getAll")
 * @returns Validated and typed data
 * @throws Error if validation fails
 */
export function validateResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues;
      console.error(`[${context}] Response validation failed:`, issues);
      throw new Error(
        `Invalid API response format in ${context}: ${issues
          .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Safely extract data from API response wrapper
 * Handles both wrapped ({success, data}) and unwrapped responses
 *
 * @param response - API response (may be wrapped or unwrapped)
 * @returns The data payload
 */
export function extractData<T>(response: any): T {
  // Check if response has the standard {success, data} wrapper
  if (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'data' in response
  ) {
    return response.data as T;
  }

  // Check if response is an error
  if (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'error' in response
  ) {
    throw new Error(response.error || 'API request failed');
  }

  // Otherwise return the response itself (unwrapped)
  return response as T;
}
