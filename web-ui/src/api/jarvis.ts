import type { Note } from '../types';
import { apiClient } from './client';
import {
  SummarizeApiResponseSchema,
  DistillNoteResponseSchema,
  DistillationLevelsResponseSchema,
  SpeakApiResponseSchema,
  validateResponse,
  extractData,
} from './schemas';

/**
 * Jarvis API Client
 * Handles Progressive Summarization with JARVIS agent integration
 */

export interface SummarizeResponse {
  summary: string;
  audioPlayed: boolean;
}

export interface DistillationLevel {
  level: number;
  name: string;
  description: string;
}

export interface BatchSummarizeProgress {
  type: 'progress' | 'result' | 'complete' | 'error';
  current?: number;
  total?: number;
  noteId?: string;
  summary?: string;
  error?: string;
  results?: Array<{
    noteId: string;
    summary: string;
    error?: string;
  }>;
}

export const jarvisApi = {
  /**
   * Summarize a single note with JARVIS
   */
  summarize: async (
    noteId: string,
    options?: {
      language?: 'en' | 'zh';
      voice?: boolean;
    }
  ): Promise<SummarizeResponse> => {
    const response = await apiClient.post(
      `/jarvis/summarize/${noteId}`,
      {
        language: options?.language || 'en',
        voice: options?.voice || false,
      }
    );
    const validated = validateResponse(response, SummarizeApiResponseSchema, 'jarvis.summarize');
    return extractData(validated);
  },

  /**
   * Progress note to next distillation level with JARVIS guidance
   */
  distill: async (
    noteId: string,
    targetLevel: number,
    options?: {
      language?: 'en' | 'zh';
      voice?: boolean;
    }
  ): Promise<Note> => {
    const response = await apiClient.post(
      `/jarvis/distill/${noteId}`,
      {
        targetLevel,
        language: options?.language || 'en',
        voice: options?.voice || false,
      }
    );
    const validated = validateResponse(response, DistillNoteResponseSchema, 'jarvis.distill');
    return extractData(validated);
  },

  /**
   * Batch summarize multiple notes with progress tracking via SSE
   * Fixed: Uses fetch + ReadableStream instead of EventSource (which doesn't support POST)
   */
  batchSummarize: async (
    noteIds: string[],
    options: {
      language?: 'en' | 'zh';
      voice?: boolean;
      onProgress?: (event: BatchSummarizeProgress) => void;
      onComplete?: (results: Array<{ noteId: string; summary: string; error?: string }>) => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const url = `${baseURL}/jarvis/batch-summarize`;

    try {
      // Send POST request with fetch (supports request body unlike EventSource)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteIds,
          language: options.language || 'en',
          voice: options.voice || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Read SSE stream manually using ReadableStream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (SSE messages end with \n\n)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = line.slice(6); // Remove 'data: ' prefix
              const data: BatchSummarizeProgress = JSON.parse(eventData);

              // Handle different event types
              if (data.type === 'progress' && options.onProgress) {
                options.onProgress(data);
              } else if (data.type === 'result' && options.onProgress) {
                options.onProgress(data);
              } else if (data.type === 'complete') {
                if (options.onComplete && data.results) {
                  options.onComplete(data.results);
                }
                return; // Complete - exit
              } else if (data.type === 'error') {
                if (options.onError && data.error) {
                  options.onError(data.error);
                }
                return; // Error - exit
              }
            } catch (parseError) {
              console.error('Error parsing SSE event:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Batch summarize error:', error);
      if (options.onError) {
        options.onError(
          error instanceof Error ? error.message : 'Failed to batch summarize notes'
        );
      }
    }
  },

  /**
   * Get information about all distillation levels
   */
  getDistillationLevels: async (): Promise<DistillationLevel[]> => {
    const response = await apiClient.get('/jarvis/distillation-levels');
    const validated = validateResponse(response, DistillationLevelsResponseSchema, 'jarvis.getDistillationLevels');
    return extractData(validated);
  },

  /**
   * Play text via Google Cloud TTS (replay summary without regenerating)
   */
  speak: async (
    text: string,
    language: 'en' | 'zh' = 'en'
  ): Promise<{ played: boolean }> => {
    const response = await apiClient.post(
      '/jarvis/speak',
      {
        text,
        language,
      }
    );
    const validated = validateResponse(response, SpeakApiResponseSchema, 'jarvis.speak');
    return extractData(validated);
  },
};
