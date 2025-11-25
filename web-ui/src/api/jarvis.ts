import type { Note } from '../types';
import { apiClient } from './client';

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
    const response = await apiClient.post<{ success: boolean; data: SummarizeResponse }>(
      `/jarvis/summarize/${noteId}`,
      {
        language: options?.language || 'en',
        voice: options?.voice || false,
      }
    );
    return response.data;
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
    const response = await apiClient.post<{ success: boolean; data: Note }>(
      `/jarvis/distill/${noteId}`,
      {
        targetLevel,
        language: options?.language || 'en',
        voice: options?.voice || false,
      }
    );
    return response.data;
  },

  /**
   * Batch summarize multiple notes with progress tracking via SSE
   */
  batchSummarize: (
    noteIds: string[],
    options: {
      language?: 'en' | 'zh';
      voice?: boolean;
      onProgress?: (event: BatchSummarizeProgress) => void;
      onComplete?: (results: Array<{ noteId: string; summary: string; error?: string }>) => void;
      onError?: (error: string) => void;
    }
  ): EventSource => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const url = `${baseURL}/jarvis/batch-summarize`;

    // Create EventSource for SSE
    const eventSource = new EventSource(url);

    // Handle messages
    eventSource.onmessage = (event) => {
      try {
        const data: BatchSummarizeProgress = JSON.parse(event.data);

        if (data.type === 'progress' && options.onProgress) {
          options.onProgress(data);
        } else if (data.type === 'result' && options.onProgress) {
          options.onProgress(data);
        } else if (data.type === 'complete') {
          if (options.onComplete && data.results) {
            options.onComplete(data.results);
          }
          eventSource.close();
        } else if (data.type === 'error') {
          if (options.onError && data.error) {
            options.onError(data.error);
          }
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
        if (options.onError) {
          options.onError('Failed to parse server response');
        }
        eventSource.close();
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      if (options.onError) {
        options.onError('Connection error');
      }
      eventSource.close();
    };

    // Send the initial request via POST (SSE doesn't support request body directly)
    // We need to use fetch to send the POST request first
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        noteIds,
        language: options.language || 'en',
        voice: options.voice || false,
      }),
    }).catch((error) => {
      console.error('Failed to initiate batch summarize:', error);
      if (options.onError) {
        options.onError('Failed to initiate batch summarization');
      }
      eventSource.close();
    });

    return eventSource;
  },

  /**
   * Get information about all distillation levels
   */
  getDistillationLevels: async (): Promise<DistillationLevel[]> => {
    const response = await apiClient.get<{ success: boolean; data: DistillationLevel[] }>(
      '/jarvis/distillation-levels'
    );
    return response.data;
  },

  /**
   * Play text via Google Cloud TTS (replay summary without regenerating)
   */
  speak: async (
    text: string,
    language: 'en' | 'zh' = 'en'
  ): Promise<{ played: boolean }> => {
    const response = await apiClient.post<{ success: boolean; data: { played: boolean } }>(
      '/jarvis/speak',
      {
        text,
        language,
      }
    );
    return response.data;
  },
};
