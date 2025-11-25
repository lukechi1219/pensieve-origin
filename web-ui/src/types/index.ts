// Note types
export interface Note {
  id: string;
  title: string;
  content: string;
  created: string;
  modified: string;
  tags: string[];
  // paraFolder and paraPath may be out of sync with actual file location
  // Always use filePath as source of truth for note location
  paraFolder?: 'inbox' | 'projects' | 'areas' | 'resources' | 'archive';
  paraPath?: string;
  distillationLevel: 0 | 1 | 2 | 3 | 4;
  distillationHistory: DistillationEntry[];
  isInspiring: boolean;
  isUseful: boolean;
  isPersonal: boolean;
  isSurprising: boolean;
  status: 'active' | 'archived' | 'draft';
  filePath?: string; // Source of truth for note location
}

export interface DistillationEntry {
  level: number;
  date: string;
  type: string;
}

// Journal types
export interface Journal {
  id: string;
  title: string;
  content: string;
  type: 'journal';
  date: string;
  tags: string[];
  mood?: string;
  energy_level?: number;
  habits_completed: string[];
  gratitude: string[];
  file_path?: string;
}

// Project types
export interface Project {
  name: string;
  description: string;
  created?: string;
  deadline?: string;
  completionDate?: string | null;
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  goal?: string;
  successCriteria?: string[];
  relatedAreas?: string[];
  tags?: string[];
  notes?: string;
  progress: {
    percentComplete: number;
    lastUpdated: string;
    milestones: Milestone[];
  };
  archive: {
    archived: boolean;
    archive_date: string | null;
    archive_reason: string;
    lessons_learned: string;
  };
  path?: string;
  folder_path?: string;
}

export interface Milestone {
  name: string;
  title?: string; // Legacy field
  description?: string;
  due_date?: string;
  completed: boolean;
  completed_date?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

// Stats types
export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  averageEnergyLevel: number;
  mostCommonMood: string;
  totalHabitsCompleted: number;
}
