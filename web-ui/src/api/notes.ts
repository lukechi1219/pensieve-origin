import { apiClient } from './client';
import type { Note, ListResponse } from '../types';

export interface CreateNoteData {
  title: string;
  content: string;
  tags?: string[];
  is_inspiring?: boolean;
  is_useful?: boolean;
  is_personal?: boolean;
  is_surprising?: boolean;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  tags?: string[];
}

export const notesApi = {
  // List notes with optional filters
  list: async (params?: {
    folder?: string;
    tag?: string;
    code?: string;
  }): Promise<ListResponse<Note>> => {
    const query = new URLSearchParams();
    if (params?.folder) query.set('folder', params.folder);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.code) query.set('code', params.code);

    const queryString = query.toString();
    const endpoint = `/notes${queryString ? `?${queryString}` : ''}`;

    // Backend returns { count, notes }, transform to { items, total }
    const response = await apiClient.get<{ count: number; notes: Note[] }>(endpoint);
    return {
      items: response.notes,
      total: response.count,
    };
  },

  // Get note by ID
  getById: async (id: string): Promise<Note> => {
    return apiClient.get<Note>(`/notes/${id}`);
  },

  // Create new note
  create: async (data: CreateNoteData): Promise<Note> => {
    const response = await apiClient.post<{ message: string; note: Note }>('/notes', data);
    return response.note;
  },

  // Update note
  update: async (id: string, data: UpdateNoteData): Promise<Note> => {
    return apiClient.put<Note>(`/notes/${id}`, data);
  },

  // Delete note
  delete: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/notes/${id}`);
  },

  // Move note to another folder
  move: async (id: string, folder: string): Promise<Note> => {
    return apiClient.post<Note>(`/notes/${id}/move`, { folder });
  },
};
