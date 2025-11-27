import { formatDate, formatDateFull, generateDateId } from '../utils/dateUtils';

export interface JournalFrontmatter {
  id: string; // YYYYMMDD
  title: string;
  type: 'journal';
  date: string; // YYYY-MM-DD
  tags: string[];
  mood?: string;
  energy_level?: number; // 0-10
  sleep_quality?: number; // 0-10
  habits_completed?: string[];
  gratitude?: string[];
}

export class Journal {
  frontmatter: JournalFrontmatter;
  content: string;
  filePath?: string;

  constructor(frontmatter: JournalFrontmatter, content: string, filePath?: string) {
    this.frontmatter = frontmatter;
    this.content = content;
    this.filePath = filePath;
  }

  /**
   * Create a new journal entry
   */
  /**
   * Create a new journal entry
   * Note: This creates a Journal object but does not generate Markdown from template.
   * Use TemplateService.instantiate('journal', variables) for full template generation.
   */
  static create(date: Date = new Date()): Journal {
    const dateId = generateDateId(date);
    const dateStr = formatDate(date);
    const dateFull = formatDateFull(date);

    const frontmatter: JournalFrontmatter = {
      id: dateId,
      title: `Journal Entry - ${dateFull}`,
      type: 'journal',
      date: dateStr,
      tags: ['journal', 'daily'],
      mood: '',
      energy_level: 0,
      habits_completed: [],
      gratitude: [],
    };

    // Minimal content - full template generation should use TemplateService
    const content = `# ${dateFull}\n\n`;

    return new Journal(frontmatter, content);
  }

  /**
   * Create a Journal from template-generated Markdown
   */
  static fromTemplate(templateContent: string, filePath?: string): Journal {
    const matter = require('gray-matter');
    const { data, content } = matter(templateContent);
    return new Journal(data as JournalFrontmatter, content.trim(), filePath);
  }

  /**
   * Update mood
   */
  setMood(mood: string): void {
    this.frontmatter.mood = mood;
  }

  /**
   * Update energy level
   */
  setEnergyLevel(level: number): void {
    this.frontmatter.energy_level = Math.max(0, Math.min(10, level));
  }

  /**
   * Add completed habit
   */
  addHabit(habit: string): void {
    if (!this.frontmatter.habits_completed) {
      this.frontmatter.habits_completed = [];
    }
    if (!this.frontmatter.habits_completed.includes(habit)) {
      this.frontmatter.habits_completed.push(habit);
    }
  }

  /**
   * Add gratitude item
   */
  addGratitude(item: string): void {
    if (!this.frontmatter.gratitude) {
      this.frontmatter.gratitude = [];
    }
    this.frontmatter.gratitude.push(item);
  }

  /**
   * Get journal date as Date object
   */
  getDate(): Date {
    return new Date(this.frontmatter.date);
  }

  /**
   * Check if entry has content (not just template)
   */
  hasContent(): boolean {
    // Simple heuristic: check if content is longer than template
    return this.content.length > 500;
  }

  /**
   * Get habit completion count
   */
  getHabitCount(): number {
    return this.frontmatter.habits_completed?.length || 0;
  }
}
