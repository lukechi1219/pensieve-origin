import type { Chat } from '../types';
import { apiClient } from './client';
import {
  ChatListResponseSchema,
  ChatStatsResponseSchema,
  SingleChatResponseSchema,
  validateResponse,
  extractData,
} from './schemas';

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
    const response = await apiClient.get('/chats');
    const validated = validateResponse(response, ChatListResponseSchema, 'chats.getAll');
    return extractData(validated);
  },

  /**
   * Get chat statistics
   */
  getStats: async (): Promise<ChatStats> => {
    const response = await apiClient.get('/chats/stats');
    const validated = validateResponse(response, ChatStatsResponseSchema, 'chats.getStats');
    return extractData(validated);
  },

  /**
   * Get a specific chat by ID
   */
  getById: async (id: string): Promise<Chat> => {
    const response = await apiClient.get(`/chats/${id}`);
    const validated = validateResponse(response, SingleChatResponseSchema, 'chats.getById');
    return extractData(validated);
  },

  /**
   * Create a new chat
   */
  create: async (title: string, messages: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<Chat> => {
    const response = await apiClient.post('/chats', { title, messages });
    const validated = validateResponse(response, SingleChatResponseSchema, 'chats.create');
    return extractData(validated);
  },

  /**
   * Add a message to a chat (and get JARVIS response)
   */
  addMessage: async (id: string, content: string, language: 'en' | 'zh' = 'zh', voiceMode: boolean = false): Promise<Chat> => {
    const response = await apiClient.post(`/chats/${id}/messages`, { content, language, voiceMode });
    const validated = validateResponse(response, SingleChatResponseSchema, 'chats.addMessage');
    return extractData(validated);
  },

  /**
   * Delete a chat
   */
  delete: async (id: string): Promise<{ id: string }> => {
    const response = await apiClient.delete(`/chats/${id}`);
    // Delete response is simple {success, data: {id}}
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid delete response format');
    }
    return extractData(response);
  },
};
