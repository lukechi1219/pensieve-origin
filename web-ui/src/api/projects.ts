import { apiClient } from './client';
import type { Project, ListResponse } from '../types';
import {
  ProjectListResponseSchema,
  ProjectSchema,
  validateResponse,
} from './schemas';

export interface CreateProjectData {
  name: string;
  description: string;
  deadline?: string;
}

export interface UpdateProjectData {
  description?: string;
  deadline?: string;
  status?: 'active' | 'completed' | 'on-hold' | 'archived';
}

export interface AddMilestoneData {
  title: string;
  description?: string;
  due_date?: string;
}

export const projectsApi = {
  // List all projects
  list: async (): Promise<ListResponse<Project>> => {
    const response = await apiClient.get('/projects');
    const validated = validateResponse(response, ProjectListResponseSchema, 'projects.list');

    // Backend returns { count, projects }, transform to { items, total }
    return {
      items: validated.projects,
      total: validated.count,
    };
  },

  // Get project by name
  getByName: async (name: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${encodeURIComponent(name)}`);
    return validateResponse(response, ProjectSchema, 'projects.getByName');
  },

  // Create new project
  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return validateResponse(response, ProjectSchema, 'projects.create');
  },

  // Update project
  update: async (name: string, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.put(`/projects/${encodeURIComponent(name)}`, data);
    return validateResponse(response, ProjectSchema, 'projects.update');
  },

  // Update project progress
  updateProgress: async (name: string, progress: number): Promise<Project> => {
    const response = await apiClient.post(
      `/projects/${encodeURIComponent(name)}/progress`,
      { progress }
    );
    return validateResponse(response, ProjectSchema, 'projects.updateProgress');
  },

  // Add milestone
  addMilestone: async (name: string, milestone: AddMilestoneData): Promise<Project> => {
    const response = await apiClient.post(
      `/projects/${encodeURIComponent(name)}/milestones`,
      {
        milestoneName: milestone.title,
        dueDate: milestone.due_date,
        description: milestone.description
      }
    );
    return validateResponse(response, ProjectSchema, 'projects.addMilestone');
  },

  // Complete milestone
  completeMilestone: async (name: string, milestoneName: string): Promise<{ message: string }> => {
    const response = await apiClient.post(
      `/projects/${encodeURIComponent(name)}/milestones/${encodeURIComponent(milestoneName)}/complete`,
      {}
    );
    // Simple validation for message response
    if (!response || typeof response !== 'object' || !('message' in response)) {
      throw new Error('Invalid complete milestone response format');
    }
    return response as { message: string };
  },

  // Complete project
  complete: async (
    name: string,
    data: { outcome: string; lessons_learned?: string }
  ): Promise<Project> => {
    const response = await apiClient.post(
      `/projects/${encodeURIComponent(name)}/complete`,
      data
    );
    return validateResponse(response, ProjectSchema, 'projects.complete');
  },

  // Archive project
  archive: async (name: string): Promise<{ message: string; archive_path: string }> => {
    const response = await apiClient.post(
      `/projects/${encodeURIComponent(name)}/archive`,
      {}
    );
    // Simple validation for archive response
    if (!response || typeof response !== 'object' || !('message' in response) || !('archive_path' in response)) {
      throw new Error('Invalid archive response format');
    }
    return response as { message: string; archive_path: string };
  },
};
