import yaml from 'js-yaml';
import { formatDate } from '../utils/dateUtils';

export interface ProjectMilestone {
  name: string;
  due_date: string;
  completed: boolean;
}

export interface ProjectProgress {
  percent_complete: number;
  last_updated: string;
  milestones: ProjectMilestone[];
}

export interface ProjectArchive {
  archived: boolean;
  archive_date: string | null;
  archive_reason: '' | 'completed' | 'cancelled' | 'merged';
  lessons_learned: string;
}

export interface ProjectMetadata {
  name: string;
  status: 'active' | 'on-hold' | 'completed';
  created: string;
  deadline: string;
  completion_date: string | null;
  description: string;
  goal: string;
  success_criteria: string[];
  related_areas: string[];
  tags: string[];
  notes: string;
  progress: ProjectProgress;
  archive: ProjectArchive;
}

export class Project {
  metadata: ProjectMetadata;
  dirPath?: string;

  constructor(metadata: ProjectMetadata, dirPath?: string) {
    this.metadata = metadata;
    this.dirPath = dirPath;
  }

  /**
   * Create a new project
   */
  static create(name: string, description: string, deadlineMonths: number = 3): Project {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setMonth(deadline.getMonth() + deadlineMonths);

    const metadata: ProjectMetadata = {
      name,
      status: 'active',
      created: formatDate(now),
      deadline: formatDate(deadline),
      completion_date: null,
      description,
      goal: '',
      success_criteria: [],
      related_areas: [],
      tags: [],
      notes: '',
      progress: {
        percent_complete: 0,
        last_updated: formatDate(now),
        milestones: [],
      },
      archive: {
        archived: false,
        archive_date: null,
        archive_reason: '',
        lessons_learned: '',
      },
    };

    return new Project(metadata);
  }

  /**
   * Parse project.yaml file
   */
  static fromYAML(yamlContent: string, dirPath?: string): Project {
    const metadata = yaml.load(yamlContent) as ProjectMetadata;
    return new Project(metadata, dirPath);
  }

  /**
   * Serialize to YAML
   */
  toYAML(): string {
    return yaml.dump(this.metadata, {
      indent: 2,
      lineWidth: 80,
    });
  }

  /**
   * Update progress percentage
   */
  updateProgress(percent: number): void {
    this.metadata.progress.percent_complete = Math.max(0, Math.min(100, percent));
    this.metadata.progress.last_updated = formatDate(new Date());
  }

  /**
   * Add milestone
   */
  addMilestone(name: string, dueDate: string): void {
    this.metadata.progress.milestones.push({
      name,
      due_date: dueDate,
      completed: false,
    });
  }

  /**
   * Complete milestone
   */
  completeMilestone(name: string): void {
    const milestone = this.metadata.progress.milestones.find(m => m.name === name);
    if (milestone) {
      milestone.completed = true;
      this.updateProgressFromMilestones();
    }
  }

  /**
   * Calculate progress from completed milestones
   */
  updateProgressFromMilestones(): void {
    const total = this.metadata.progress.milestones.length;
    if (total === 0) return;

    const completed = this.metadata.progress.milestones.filter(m => m.completed).length;
    this.updateProgress(Math.round((completed / total) * 100));
  }

  /**
   * Mark project as completed
   */
  complete(lessonsLearned: string = ''): void {
    this.metadata.status = 'completed';
    this.metadata.completion_date = formatDate(new Date());
    this.metadata.progress.percent_complete = 100;

    if (lessonsLearned) {
      this.metadata.archive.lessons_learned = lessonsLearned;
    }
  }

  /**
   * Archive project
   */
  archive(reason: ProjectArchive['archive_reason'], lessonsLearned: string = ''): void {
    this.metadata.archive.archived = true;
    this.metadata.archive.archive_date = formatDate(new Date());
    this.metadata.archive.archive_reason = reason;
    this.metadata.archive.lessons_learned = lessonsLearned;
  }

  /**
   * Check if project is overdue
   */
  isOverdue(): boolean {
    if (this.metadata.status === 'completed') return false;
    const deadline = new Date(this.metadata.deadline);
    return new Date() > deadline;
  }

  /**
   * Get days until deadline
   */
  daysUntilDeadline(): number {
    const deadline = new Date(this.metadata.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Add related area
   */
  addRelatedArea(area: string): void {
    if (!this.metadata.related_areas.includes(area)) {
      this.metadata.related_areas.push(area);
    }
  }
}
