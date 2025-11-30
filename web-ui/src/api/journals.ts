import { apiClient } from './client';
import type { Journal, JournalStats, ListResponse } from '../types';
import {
  JournalListResponseSchema,
  JournalSchema,
  JournalStatsSchema,
  StreakResponseSchema,
  validateResponse,
} from './schemas';

export interface UpdateJournalData {
  content?: string;
  mood?: string;
  energyLevel?: number;
  sleepQuality?: number;
  habitsCompleted?: string[];
  gratitude?: string[];
}

// Define an interface for the expected update response structure
interface UpdateJournalResponse {
  message: string;
  journal: Journal;
}

export const journalsApi = {
  // List journals by date range or month
  list: async (params?: {
    start?: string;
    end?: string;
    month?: string; // Format: YYYY-MM
  }): Promise<ListResponse<Journal>> => {
    const query = new URLSearchParams();
    if (params?.start) query.set('start', params.start);
    if (params?.end) query.set('end', params.end);
    if (params?.month) query.set('month', params.month);

    const queryString = query.toString();
    const endpoint = `/journals${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(endpoint);
    const validated = validateResponse(response, JournalListResponseSchema, 'journals.list');

    // Backend returns { count, journals }, transform to { items, total }
    return {
      items: validated.journals,
      total: validated.count,
    };
  },

  // Get today's journal
  getToday: async (): Promise<Journal> => {
    const response = await apiClient.get('/journals/today');
    return validateResponse(response, JournalSchema, 'journals.getToday');
  },

  // Get yesterday's journal
  getYesterday: async (): Promise<Journal> => {
    const response = await apiClient.get('/journals/yesterday');
    return validateResponse(response, JournalSchema, 'journals.getYesterday');
  },

  // Get journal by specific date
  getByDate: async (date: string): Promise<Journal> => {
    const response = await apiClient.get(`/journals/${date}`);
    return validateResponse(response, JournalSchema, 'journals.getByDate');
  },

  // Update journal entry
  update: async (date: string, data: UpdateJournalData): Promise<Journal> => {
    const response = await apiClient.put(`/journals/${date}`, data) as UpdateJournalResponse;
    // Directly access the 'journal' property from the response,
    // as the backend returns { message, journal: JournalObject }
    return validateResponse(response.journal, JournalSchema, 'journals.update');
  },

  // Get journaling streak
  getStreak: async (): Promise<{ current_streak: number; longest_streak: number }> => {
    const response = await apiClient.get('/journals/streak');
    return validateResponse(response, StreakResponseSchema, 'journals.getStreak');
  },


  // Get journal statistics
  getStats: async (): Promise<JournalStats> => {
    const response = await apiClient.get('/journals/stats');
    return validateResponse(response, JournalStatsSchema, 'journals.getStats');
  },
};
