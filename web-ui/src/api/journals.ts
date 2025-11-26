import { apiClient } from './client';
import type { Journal, JournalStats, ListResponse } from '../types';

export interface UpdateJournalData {
  content?: string;
  mood?: string;
  energy_level?: number;
  habits_completed?: string[];
  gratitude?: string[];
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

    // Backend returns { count, journals }, transform to { items, total }
    const response = await apiClient.get<{ count: number; journals: Journal[] }>(endpoint);
    return {
      items: response.journals,
      total: response.count,
    };
  },

  // Get today's journal
  getToday: async (): Promise<Journal> => {
    return apiClient.get<Journal>('/journals/today');
  },

  // Get yesterday's journal
  getYesterday: async (): Promise<Journal> => {
    return apiClient.get<Journal>('/journals/yesterday');
  },

  // Get journal by specific date
  getByDate: async (date: string): Promise<Journal> => {
    return apiClient.get<Journal>(`/journals/${date}`);
  },

  // Update journal entry
  update: async (date: string, data: UpdateJournalData): Promise<Journal> => {
    return apiClient.put<Journal>(`/journals/${date}`, data);
  },

  // Get journaling streak
  getStreak: async (): Promise<{ current_streak: number; longest_streak: number }> => {
    return apiClient.get<{ current_streak: number; longest_streak: number }>(
      '/journals/streak'
    );
  },

  // Get journal statistics
  getStats: async (): Promise<JournalStats> => {
    return apiClient.get<JournalStats>('/journals/stats');
  },
};
