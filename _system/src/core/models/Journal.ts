import { formatDate, formatDateFull, generateDateId } from '../utils/dateUtils';

export interface JournalFrontmatter {
  id: string; // YYYYMMDD
  title: string;
  type: 'journal';
  date: string; // YYYY-MM-DD
  tags: string[];
  mood?: string;
  energy_level?: number; // 0-10
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

    const content = `# ${dateFull}

## Morning Reflection

**Intention for today:**


**Top 3 priorities:**
1.
2.
3.

## Daily Log

### Work & Projects


### Personal & Life


### Learning & Insights


## Evening Review

### Wins & Accomplishments
-

### Challenges & Obstacles
-

### What I Learned Today
-

### Gratitude
-
-
-

### Tomorrow's Focus
-

## Habits Tracker

- [ ] Morning routine
- [ ] Exercise
- [ ] Meditation
- [ ] Deep work session
- [ ] Reading
- [ ] Journaling (you're doing it now!)

## Mood & Energy

**Mood**: (productive / focused / stressed / relaxed / energized / tired)

**Energy Level**: 0/10

**Sleep Quality**: 0/10

## Notes & Ideas

`;

    return new Journal(frontmatter, content);
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
