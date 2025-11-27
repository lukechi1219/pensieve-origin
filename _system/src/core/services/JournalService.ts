import path from 'path';
import { Journal, JournalFrontmatter } from '../models/Journal';
import { parseFrontmatter, serializeFrontmatter } from '../utils/frontmatterParser';
import {
  readFile,
  writeFile,
  fileExists,
  listFiles,
} from '../utils/fileSystem';
import {
  generateDateId,
  getJournalPathComponents,
  getYesterday,
  daysBetween,
  parseDateId,
  formatDate,
  formatDateFull,
} from '../utils/dateUtils';
import { TemplateService } from './TemplateService';

export interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  averageEnergyLevel: number;
  mostCommonMood: string;
  totalHabitsCompleted: number;
}

export class JournalService {
  private static vaultPath: string = process.env.VAULT_PATH || './vault';

  /**
   * Set vault path
   */
  static setVaultPath(vaultPath: string): void {
    this.vaultPath = vaultPath;
  }

  /**
   * Get journal file path for a specific date
   */
  static getJournalPath(date: Date): string {
    const { year, month, fileName } = getJournalPathComponents(date);
    return path.join(this.vaultPath, 'journal', year, month, fileName);
  }

  /**
   * Get today's journal
   */
  static async getToday(): Promise<Journal> {
    return await this.getByDate(new Date());
  }

  /**
   * Get journal by date, create if doesn't exist
   */
  static async getByDate(date: Date): Promise<Journal> {
    const filePath = this.getJournalPath(date);

    if (fileExists(filePath)) {
      const content = await readFile(filePath);
      const parsed = parseFrontmatter(content);
      return new Journal(
        parsed.frontmatter as JournalFrontmatter,
        parsed.content,
        filePath
      );
    } else {
      // Create new journal entry from template
      const templateService = new TemplateService(this.vaultPath);
      const templateContent = await templateService.instantiate('journal', {
        date_id: generateDateId(date),
        date: formatDate(date),
        date_full: formatDateFull(date),
      });

      const journal = Journal.fromTemplate(templateContent, filePath);
      await writeFile(filePath, templateContent);
      return journal;
    }
  }

  /**
   * Get yesterday's journal (read-only, don't create)
   */
  static async getYesterday(): Promise<Journal | null> {
    const yesterday = getYesterday();
    const filePath = this.getJournalPath(yesterday);

    if (!fileExists(filePath)) {
      return null;
    }

    const content = await readFile(filePath);
    const parsed = parseFrontmatter(content);
    return new Journal(
      parsed.frontmatter as JournalFrontmatter,
      parsed.content,
      filePath
    );
  }

  /**
   * List journals by date range
   */
  static async listByRange(startDate: Date, endDate: Date): Promise<Journal[]> {
    const journals: Journal[] = [];
    const journalPath = path.join(this.vaultPath, 'journal');

    const files = await listFiles(journalPath, { recursive: true, extension: '.md' });

    for (const filePath of files) {
      const content = await readFile(filePath);
      const parsed = parseFrontmatter(content);
      const journal = new Journal(
        parsed.frontmatter as JournalFrontmatter,
        parsed.content,
        filePath
      );

      const entryDate = journal.getDate();
      if (entryDate >= startDate && entryDate <= endDate) {
        journals.push(journal);
      }
    }

    return journals.sort((a, b) => a.getDate().getTime() - b.getDate().getTime());
  }

  /**
   * List journals by month
   */
  static async listByMonth(year: number, month: number): Promise<Journal[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month at 23:59:59.999
    return await this.listByRange(startDate, endDate);
  }

  /**
   * Get current streak (consecutive days with entries)
   */
  static async getStreak(): Promise<number> {
    let streak = 0;
    let checkDate = new Date();

    // Check if today has an entry, if not start from yesterday
    const todayPath = this.getJournalPath(checkDate);
    if (!fileExists(todayPath)) {
      checkDate = getYesterday();
    }

    while (true) {
      const filePath = this.getJournalPath(checkDate);
      if (!fileExists(filePath)) {
        break;
      }

      const content = await readFile(filePath);
      const parsed = parseFrontmatter(content);
      const journal = new Journal(
        parsed.frontmatter as JournalFrontmatter,
        parsed.content,
        filePath
      );

      // Check if entry has actual content (not just template)
      if (!journal.hasContent()) {
        break;
      }

      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Get journal statistics
   */
  static async getStats(): Promise<JournalStats> {
    const journalPath = path.join(this.vaultPath, 'journal');
    const files = await listFiles(journalPath, { recursive: true, extension: '.md' });

    const journals: Journal[] = [];
    for (const filePath of files) {
      const content = await readFile(filePath);
      const parsed = parseFrontmatter(content);
      const journal = new Journal(
        parsed.frontmatter as JournalFrontmatter,
        parsed.content,
        filePath
      );

      if (journal.hasContent()) {
        journals.push(journal);
      }
    }

    const totalEntries = journals.length;
    const currentStreak = await this.getStreak();

    // Calculate longest streak
    const sortedJournals = journals
      .sort((a, b) => a.getDate().getTime() - b.getDate().getTime());

    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const journal of sortedJournals) {
      const currentDate = journal.getDate();

      if (lastDate && daysBetween(lastDate, currentDate) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = currentDate;
    }

    // Calculate average energy level
    const energyLevels = journals
      .map(j => j.frontmatter.energy_level)
      .filter((e): e is number => typeof e === 'number' && e > 0);

    const averageEnergyLevel =
      energyLevels.length > 0
        ? energyLevels.reduce((sum, e) => sum + e, 0) / energyLevels.length
        : 0;

    // Find most common mood
    const moodCounts: Record<string, number> = {};
    journals.forEach(j => {
      const mood = j.frontmatter.mood;
      if (mood) {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      }
    });

    const mostCommonMood =
      Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    // Total habits completed
    const totalHabitsCompleted = journals.reduce(
      (sum, j) => sum + j.getHabitCount(),
      0
    );

    return {
      totalEntries,
      currentStreak,
      longestStreak,
      averageEnergyLevel: Math.round(averageEnergyLevel * 10) / 10,
      mostCommonMood,
      totalHabitsCompleted,
    };
  }

  /**
   * Update journal
   */
  static async update(journal: Journal): Promise<void> {
    if (!journal.filePath) {
      throw new Error('Cannot update journal without filePath');
    }

    const fileContent = serializeFrontmatter(journal.frontmatter, journal.content);
    await writeFile(journal.filePath, fileContent);
  }
}
