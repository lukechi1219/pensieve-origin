#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { config } from '../core/utils/config.js';
import { validateVaultStructure, createVaultStructure } from '../core/utils/vaultValidator.js';
import { NoteService } from '../core/services/NoteService.js';
import { JournalService } from '../core/services/JournalService.js';
import { formatDateTime, formatDate } from '../core/utils/dateUtils.js';

const program = new Command();

program
  .name('pensieve')
  .description('A second brain knowledge management system')
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize the Pensieve vault structure')
  .action(async () => {
    const spinner = ora('Initializing Pensieve vault...').start();

    try {
      const validation = await validateVaultStructure();

      if (validation.valid) {
        spinner.succeed('Vault structure already exists and is valid');
        console.log(chalk.gray(`Vault path: ${config.vaultPath}`));
        return;
      }

      spinner.text = 'Creating vault structure...';
      await createVaultStructure();

      spinner.succeed('Vault structure created successfully');
      console.log(chalk.green('\n✓ Created directories:'));
      console.log(chalk.gray('  - 0-inbox (unsorted captures)'));
      console.log(chalk.gray('  - 1-projects (2-3 month goals)'));
      console.log(chalk.gray('  - 2-areas (life domains)'));
      console.log(chalk.gray('  - 3-resources (reference material)'));
      console.log(chalk.gray('  - 4-archive (completed projects)'));
      console.log(chalk.gray('  - journal (daily entries)'));
      console.log(chalk.gray('  - templates (note templates)'));
      console.log(chalk.gray(`\nVault path: ${config.vaultPath}`));
    } catch (error) {
      spinner.fail('Failed to initialize vault');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Capture command
program
  .command('capture <text>')
  .description('Quick capture a note to inbox')
  .option('--inspiring', 'Mark as inspiring')
  .option('--useful', 'Mark as useful')
  .option('--personal', 'Mark as personal')
  .option('--surprising', 'Mark as surprising')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(async (text: string, options: {
    inspiring?: boolean;
    useful?: boolean;
    personal?: boolean;
    surprising?: boolean;
    tags?: string;
  }) => {
    const spinner = ora('Capturing note...').start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      NoteService.setVaultPath(config.vaultPath);

      const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];

      const note = await NoteService.create(
        text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        text,
        {
          tags,
          isInspiring: options.inspiring || false,
          isUseful: options.useful || false,
          isPersonal: options.personal || false,
          isSurprising: options.surprising || false,
        }
      );

      spinner.succeed('Note captured successfully');
      console.log(chalk.green(`\n✓ Note ID: ${note.frontmatter.id}`));
      console.log(chalk.gray(`  File: ${note.filePath}`));
      if (tags.length > 0) {
        console.log(chalk.gray(`  Tags: ${tags.join(', ')}`));
      }
      if (options.inspiring || options.useful || options.personal || options.surprising) {
        const criteria = [];
        if (options.inspiring) criteria.push('inspiring');
        if (options.useful) criteria.push('useful');
        if (options.personal) criteria.push('personal');
        if (options.surprising) criteria.push('surprising');
        console.log(chalk.gray(`  CODE: ${criteria.join(', ')}`));
      }
    } catch (error) {
      spinner.fail('Failed to capture note');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Journal command
const journalCmd = program
  .command('journal')
  .description('Open or view journal entries')
  .option('-d, --date <date>', 'Specific date (YYYY-MM-DD format)')
  .action(async (options: { date?: string }) => {
    const spinner = ora('Loading journal...').start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      JournalService.setVaultPath(config.vaultPath);

      let journal;
      if (options.date) {
        const date = new Date(options.date);
        if (isNaN(date.getTime())) {
          spinner.fail('Invalid date format. Use YYYY-MM-DD');
          process.exit(1);
        }
        journal = await JournalService.getByDate(date);
      } else {
        journal = await JournalService.getToday();
      }

      const journalDate = new Date(journal.frontmatter.date);
      spinner.succeed('Journal entry loaded');
      console.log(chalk.green(`\n✓ Journal: ${formatDate(journalDate)}`));
      console.log(chalk.gray(`  File: journal/${journalDate.getFullYear()}/${String(journalDate.getMonth() + 1).padStart(2, '0')}/${journal.frontmatter.id}.md`));

      if (journal.frontmatter.mood) {
        console.log(chalk.gray(`  Mood: ${journal.frontmatter.mood}`));
      }
      if (journal.frontmatter.energy_level) {
        console.log(chalk.gray(`  Energy: ${journal.frontmatter.energy_level}/10`));
      }
      if (journal.frontmatter.habits_completed && journal.frontmatter.habits_completed.length > 0) {
        console.log(chalk.gray(`  Habits: ${journal.frontmatter.habits_completed.join(', ')}`));
      }
    } catch (error) {
      spinner.fail('Failed to load journal');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Journal yesterday subcommand
journalCmd
  .command('yesterday')
  .description('View yesterday\'s journal entry')
  .action(async () => {
    const spinner = ora('Loading yesterday\'s journal...').start();

    try {
      JournalService.setVaultPath(config.vaultPath);
      const journal = await JournalService.getYesterday();

      if (!journal) {
        spinner.fail('No journal entry found for yesterday');
        process.exit(1);
      }

      const journalDate = new Date(journal.frontmatter.date);
      spinner.succeed('Yesterday\'s journal loaded');
      console.log(chalk.green(`\n✓ Journal: ${formatDate(journalDate)}`));
      console.log(chalk.gray(`  File: journal/${journalDate.getFullYear()}/${String(journalDate.getMonth() + 1).padStart(2, '0')}/${journal.frontmatter.id}.md`));

      if (journal.frontmatter.mood) {
        console.log(chalk.gray(`  Mood: ${journal.frontmatter.mood}`));
      }
      if (journal.frontmatter.energy_level) {
        console.log(chalk.gray(`  Energy: ${journal.frontmatter.energy_level}/10`));
      }
    } catch (error) {
      spinner.fail('Failed to load yesterday\'s journal');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Journal streak subcommand
journalCmd
  .command('streak')
  .description('Show current journaling streak')
  .action(async () => {
    const spinner = ora('Calculating streak...').start();

    try {
      JournalService.setVaultPath(config.vaultPath);
      const streak = await JournalService.getStreak();

      spinner.succeed('Streak calculated');
      console.log(chalk.green(`\n🔥 Current Streak: ${streak} days`));

      if (streak > 0) {
        console.log(chalk.green(`   Keep it up! 💪`));
      } else {
        console.log(chalk.yellow(`   Start a new streak today! 📝`));
      }
    } catch (error) {
      spinner.fail('Failed to calculate streak');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Journal stats subcommand
journalCmd
  .command('stats')
  .description('Show journal statistics')
  .action(async () => {
    const spinner = ora('Calculating statistics...').start();

    try {
      JournalService.setVaultPath(config.vaultPath);
      const stats = await JournalService.getStats();

      spinner.succeed('Statistics calculated');
      console.log(chalk.green(`\n📊 Journal Statistics`));
      console.log(chalk.gray(`   Total Entries: ${stats.totalEntries}`));
      console.log(chalk.gray(`   Current Streak: ${stats.currentStreak} days`));
      console.log(chalk.gray(`   Longest Streak: ${stats.longestStreak} days`));

      if (stats.averageEnergyLevel) {
        console.log(chalk.gray(`   Average Energy: ${stats.averageEnergyLevel.toFixed(1)}/10`));
      }

      if (stats.mostCommonMood) {
        console.log(chalk.gray(`   Most Common Mood: ${stats.mostCommonMood}`));
      }

      console.log(chalk.gray(`   Total Habits Completed: ${stats.totalHabitsCompleted}`));
    } catch (error) {
      spinner.fail('Failed to calculate statistics');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse(process.argv);
