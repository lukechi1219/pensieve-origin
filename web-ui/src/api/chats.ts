import type { Chat } from '../types';
import { apiClient } from './client';

export interface ChatStats {
  totalChats: number;
  totalMessages: number;
  avgMessagesPerChat: number;
  recentChats: number;
}

export const chatsApi = {
  /**
   * Get all chats (sorted by modified date, newest first)
   */
  getAll: async (): Promise<{ items: Chat[]; total: number }> => {
    const response = await apiClient.get<{ success: boolean; data: { items: Chat[]; total: number } }>('/chats');
    return response.data;
  },

  /**
   * Get chat statistics
   */
  getStats: async (): Promise<ChatStats> => {
    const response = await apiClient.get<{ success: boolean; data: ChatStats }>('/chats/stats');
    return response.data;
  },

  /**
   * Get a specific chat by ID
   */
  getById: async (id: string): Promise<Chat> => {
    const response = await apiClient.get<{ success: boolean; data: Chat }>(`/chats/${id}`);
    return response.data;
  },

  /**
   * Create a new chat
   */
  create: async (title: string, messages: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<Chat> => {
    const response = await apiClient.post<{ success: boolean; data: Chat }>('/chats', { title, messages });
    return response.data;
  },

  /**
   * Add a message to a chat (and get JARVIS response)
   */
  addMessage: async (id: string, content: string, language: 'en' | 'zh' = 'zh', voiceMode: boolean = false): Promise<Chat> => {
    const response = await apiClient.post<{ success: boolean; data: Chat }>(`/chats/${id}/messages`, { content, language, voiceMode });
    return response.data;
  },

  /**
   * Delete a chat
   */
  delete: async (id: string): Promise<{ id: string }> => {
    const response = await apiClient.delete<{ success: boolean; data: { id: string } }>(`/chats/${id}`);
    return response.data;
  },
};
