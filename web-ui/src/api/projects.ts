import { apiClient } from './client';
import type { Project, Milestone, ListResponse } from '../types';

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
    // Backend returns { count, projects }, transform to { items, total }
    const response = await apiClient.get<{ count: number; projects: Project[] }>('/projects');
    return {
      items: response.projects,
      total: response.count,
    };
  },

  // Get project by name
  getByName: async (name: string): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${encodeURIComponent(name)}`);
  },

  // Create new project
  create: async (data: CreateProjectData): Promise<Project> => {
    return apiClient.post<Project>('/projects', data);
  },

  // Update project
  update: async (name: string, data: UpdateProjectData): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${encodeURIComponent(name)}`, data);
  },

  // Update project progress
  updateProgress: async (name: string, progress: number): Promise<Project> => {
    return apiClient.post<Project>(
      `/projects/${encodeURIComponent(name)}/progress`,
      { progress }
    );
  },

  // Add milestone
  addMilestone: async (name: string, milestone: AddMilestoneData): Promise<Project> => {
    return apiClient.post<Project>(
      `/projects/${encodeURIComponent(name)}/milestones`,
      {
        milestoneName: milestone.title,
        dueDate: milestone.due_date,
        description: milestone.description
      }
    );
  },

  // Complete milestone
  completeMilestone: async (name: string, milestoneName: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(
      `/projects/${encodeURIComponent(name)}/milestones/${encodeURIComponent(milestoneName)}/complete`,
      {}
    );
  },

  // Complete project
  complete: async (
    name: string,
    data: { outcome: string; lessons_learned?: string }
  ): Promise<Project> => {
    return apiClient.post<Project>(
      `/projects/${encodeURIComponent(name)}/complete`,
      data
    );
  },

  // Archive project
  archive: async (name: string): Promise<{ message: string; archive_path: string }> => {
    return apiClient.post<{ message: string; archive_path: string }>(
      `/projects/${encodeURIComponent(name)}/archive`,
      {}
    );
  },
};
