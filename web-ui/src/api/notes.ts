import { apiClient } from './client';
import type { Note, ListResponse } from '../types';
import {
  NoteListResponseSchema,
  NoteSchema,
  CreateNoteResponseSchema,
  validateResponse,
} from './schemas';

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

    const response = await apiClient.get(endpoint);
    const validated = validateResponse(response, NoteListResponseSchema, 'notes.list');

    // Backend returns { count, notes }, transform to { items, total }
    return {
      items: validated.notes,
      total: validated.count,
    };
  },

  // Get note by ID
  getById: async (id: string): Promise<Note> => {
    const response = await apiClient.get(`/notes/${id}`);
    return validateResponse(response, NoteSchema, 'notes.getById');
  },

  // Create new note
  create: async (data: CreateNoteData): Promise<Note> => {
    const response = await apiClient.post('/notes', data);
    const validated = validateResponse(response, CreateNoteResponseSchema, 'notes.create');
    return validated.note;
  },

  // Update note
  update: async (id: string, data: UpdateNoteData): Promise<Note> => {
    const response = await apiClient.put(`/notes/${id}`, data);
    return validateResponse(response, NoteSchema, 'notes.update');
  },

  // Delete note
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/notes/${id}`);
    if (!response || typeof response !== 'object' || !('message' in response)) {
      throw new Error('Invalid delete response format');
    }
    return response as { message: string };
  },

  // Move note to another folder
  move: async (id: string, folder: string, subPath?: string): Promise<Note> => {
    const response = await apiClient.post(`/notes/${id}/move`, { folder, subPath });
    return validateResponse(response, NoteSchema, 'notes.move');
  },

  // List subfolders in a folder
  listSubfolders: async (folder: string): Promise<{ folder: string; count: number; subfolders: Array<{ name: string; count: number }> }> => {
    const response = await apiClient.get(`/notes/subfolders?folder=${folder}`);
    // Simple validation - check structure exists
    if (!response || typeof response !== 'object' || !('folder' in response)) {
      throw new Error('Invalid subfolders response format');
    }
    return response as { folder: string; count: number; subfolders: Array<{ name: string; count: number }> };
  },
};
