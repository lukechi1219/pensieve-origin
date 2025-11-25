import { formatDateTime } from '../utils/dateUtils';

export interface DistillationHistoryEntry {
  level: number;
  date: string;
  type: 'captured' | 'highlighted' | 'summarized' | 'remixed';
  summary?: string;
}

export interface NoteFrontmatter {
  id: string;
  title: string;
  created: string;
  modified: string;
  tags: string[];
  para_folder: 'inbox' | 'projects' | 'areas' | 'resources' | 'archive';
  para_path: string;

  // Progressive Summarization
  distillation_level: 0 | 1 | 2 | 3 | 4;
  distillation_history: DistillationHistoryEntry[];

  // CODE Standards
  is_inspiring: boolean;
  is_useful: boolean;
  is_personal: boolean;
  is_surprising: boolean;

  status: 'active' | 'archived' | 'draft';
}

export class Note {
  frontmatter: NoteFrontmatter;
  content: string;
  filePath?: string;

  constructor(frontmatter: NoteFrontmatter, content: string, filePath?: string) {
    this.frontmatter = frontmatter;
    this.content = content;
    this.filePath = filePath;
  }

  /**
   * Create a new note with default frontmatter
   */
  static create(title: string, content: string, id: string): Note {
    const now = new Date();
    const timestamp = formatDateTime(now);

    const frontmatter: NoteFrontmatter = {
      id,
      title,
      created: timestamp,
      modified: timestamp,
      tags: [],
      para_folder: 'inbox',
      para_path: '0-inbox',
      distillation_level: 0,
      distillation_history: [
        {
          level: 0,
          date: timestamp,
          type: 'captured',
        },
      ],
      is_inspiring: false,
      is_useful: false,
      is_personal: false,
      is_surprising: false,
      status: 'active',
    };

    return new Note(frontmatter, content);
  }

  /**
   * Update modification timestamp
   */
  touch(): void {
    this.frontmatter.modified = formatDateTime(new Date());
  }

  /**
   * Move note to different PARA folder
   */
  moveTo(paraFolder: NoteFrontmatter['para_folder'], paraPath: string): void {
    this.frontmatter.para_folder = paraFolder;
    this.frontmatter.para_path = paraPath;
    this.touch();
  }

  /**
   * Add tag
   */
  addTag(tag: string): void {
    if (!this.frontmatter.tags.includes(tag)) {
      this.frontmatter.tags.push(tag);
      this.touch();
    }
  }

  /**
   * Remove tag
   */
  removeTag(tag: string): void {
    const index = this.frontmatter.tags.indexOf(tag);
    if (index > -1) {
      this.frontmatter.tags.splice(index, 1);
      this.touch();
    }
  }

  /**
   * Update distillation level
   */
  updateDistillation(
    level: NoteFrontmatter['distillation_level'],
    type: DistillationHistoryEntry['type'],
    summary?: string
  ): void {
    this.frontmatter.distillation_level = level;
    this.frontmatter.distillation_history.push({
      level,
      date: formatDateTime(new Date()),
      type,
      summary,
    });
    this.touch();
  }

  /**
   * Mark as archived
   */
  archive(): void {
    this.frontmatter.status = 'archived';
    this.touch();
  }

  /**
   * Check if note matches CODE criteria
   */
  matchesCODE(): boolean {
    return (
      this.frontmatter.is_inspiring ||
      this.frontmatter.is_useful ||
      this.frontmatter.is_personal ||
      this.frontmatter.is_surprising
    );
  }

  /**
   * Get CODE score (0-4)
   */
  getCODEScore(): number {
    return [
      this.frontmatter.is_inspiring,
      this.frontmatter.is_useful,
      this.frontmatter.is_personal,
      this.frontmatter.is_surprising,
    ].filter(Boolean).length;
  }
}
