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
    start_date?: string;
    end_date?: string;
    year?: number;
    month?: number;
  }): Promise<ListResponse<Journal>> => {
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.year) query.set('year', params.year.toString());
    if (params?.month) query.set('month', params.month.toString());

    const queryString = query.toString();
    const endpoint = `/journals${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<ListResponse<Journal>>(endpoint);
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
