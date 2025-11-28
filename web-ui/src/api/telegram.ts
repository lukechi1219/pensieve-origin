import { apiClient } from './client';

interface UnreadTelegramMessage {
  chat_id: number;
  chat_title: string;
  unread_count: number;
}

export const getUnreadTelegramMessages = async (): Promise<UnreadTelegramMessage[]> => {
  return await apiClient.get<UnreadTelegramMessage[]>('/telegram/unread');
};
