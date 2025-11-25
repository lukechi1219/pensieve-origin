import { Router, Request, Response } from 'express';
import { JournalService } from '../../core/services/JournalService.js';
import { config } from '../../core/utils/config.js';

const router = Router();

// Set vault path
JournalService.setVaultPath(config.vaultPath);

/**
 * GET /api/journals
 * List journals by date range or month
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start, end, month } = req.query;

    let journals;

    if (month) {
      // Format: YYYY-MM
      const [year, monthNum] = (month as string).split('-').map(Number);
      if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          error: 'Invalid month format',
          message: 'Use YYYY-MM format (e.g., 2025-11)',
        });
      }
      journals = await JournalService.listByMonth(year, monthNum);
    } else if (start && end) {
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'Use YYYY-MM-DD format',
        });
      }

      journals = await JournalService.listByRange(startDate, endDate);
    } else {
      // Default: current month
      const now = new Date();
      journals = await JournalService.listByMonth(now.getFullYear(), now.getMonth() + 1);
    }

    res.json({
      count: journals.length,
      journals: journals.map(journal => ({
        id: journal.frontmatter.id,
        title: journal.frontmatter.title,
        date: journal.frontmatter.date,
        mood: journal.frontmatter.mood,
        energyLevel: journal.frontmatter.energy_level,
        habitsCompleted: journal.frontmatter.habits_completed,
        tags: journal.frontmatter.tags,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch journals',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/journals/today
 * Get or create today's journal
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const journal = await JournalService.getToday();

    res.json({
      id: journal.frontmatter.id,
      title: journal.frontmatter.title,
      date: journal.frontmatter.date,
      content: journal.content,
      mood: journal.frontmatter.mood,
      energyLevel: journal.frontmatter.energy_level,
      habitsCompleted: journal.frontmatter.habits_completed,
      gratitude: journal.frontmatter.gratitude,
      tags: journal.frontmatter.tags,
      filePath: journal.filePath,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch today\'s journal',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/journals/yesterday
 * Get yesterday's journal
 */
router.get('/yesterday', async (req: Request, res: Response) => {
  try {
    const journal = await JournalService.getYesterday();

    if (!journal) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No journal entry for yesterday',
      });
    }

    res.json({
      id: journal.frontmatter.id,
      title: journal.frontmatter.title,
      date: journal.frontmatter.date,
      content: journal.content,
      mood: journal.frontmatter.mood,
      energyLevel: journal.frontmatter.energy_level,
      habitsCompleted: journal.frontmatter.habits_completed,
      gratitude: journal.frontmatter.gratitude,
      tags: journal.frontmatter.tags,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch yesterday\'s journal',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/journals/streak
 * Get current journaling streak
 */
router.get('/streak', async (req: Request, res: Response) => {
  try {
    const streak = await JournalService.getStreak();

    res.json({
      current: streak,
      message: streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} streak!` : 'Start your streak today!',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to calculate streak',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/journals/stats
 * Get journal statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await JournalService.getStats();

    res.json({
      totalEntries: stats.totalEntries,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      averageEnergyLevel: stats.averageEnergyLevel,
      mostCommonMood: stats.mostCommonMood,
      totalHabitsCompleted: stats.totalHabitsCompleted,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to calculate statistics',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/journals/:date
 * Get journal by specific date
 */
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const journalDate = new Date(date);

    if (isNaN(journalDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Use YYYY-MM-DD format',
      });
    }

    const journal = await JournalService.getByDate(journalDate);

    res.json({
      id: journal.frontmatter.id,
      title: journal.frontmatter.title,
      date: journal.frontmatter.date,
      content: journal.content,
      mood: journal.frontmatter.mood,
      energyLevel: journal.frontmatter.energy_level,
      habitsCompleted: journal.frontmatter.habits_completed,
      gratitude: journal.frontmatter.gratitude,
      tags: journal.frontmatter.tags,
      filePath: journal.filePath,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch journal',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/journals/:date
 * Update journal entry
 */
router.put('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { content, mood, energyLevel, habitsCompleted, gratitude } = req.body;

    const journalDate = new Date(date);
    if (isNaN(journalDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Use YYYY-MM-DD format',
      });
    }

    const journal = await JournalService.getByDate(journalDate);

    if (content !== undefined) {
      journal.content = content;
    }
    if (mood !== undefined) {
      journal.setMood(mood);
    }
    if (energyLevel !== undefined) {
      if (energyLevel < 1 || energyLevel > 10) {
        return res.status(400).json({
          error: 'Invalid energy level',
          message: 'Energy level must be between 1 and 10',
        });
      }
      journal.setEnergyLevel(energyLevel);
    }
    if (habitsCompleted !== undefined) {
      journal.frontmatter.habits_completed = habitsCompleted;
    }
    if (gratitude !== undefined) {
      journal.frontmatter.gratitude = gratitude;
    }

    await JournalService.update(journal);

    res.json({
      message: 'Journal updated successfully',
      journal: {
        id: journal.frontmatter.id,
        date: journal.frontmatter.date,
        mood: journal.frontmatter.mood,
        energyLevel: journal.frontmatter.energy_level,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update journal',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
