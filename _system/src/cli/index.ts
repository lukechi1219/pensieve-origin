#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { config } from '../core/utils/config.js';
import { validateVaultStructure, createVaultStructure } from '../core/utils/vaultValidator.js';
import { NoteService } from '../core/services/NoteService.js';
import { JournalService } from '../core/services/JournalService.js';
import { ProjectService } from '../core/services/ProjectService.js';
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

// List command
program
  .command('list [folder]')
  .description('List notes in a PARA folder (inbox, projects, areas, resources, archive)')
  .action(async (folder?: string) => {
    const spinner = ora('Loading notes...').start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      NoteService.setVaultPath(config.vaultPath);

      // Default to inbox if no folder specified
      const paraFolder = (folder || 'inbox') as 'inbox' | 'projects' | 'areas' | 'resources' | 'archive';

      // Validate folder name
      const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive'];
      if (!validFolders.includes(paraFolder)) {
        spinner.fail(`Invalid folder. Must be one of: ${validFolders.join(', ')}`);
        process.exit(1);
      }

      const notes = await NoteService.listByFolder(paraFolder);

      spinner.succeed(`Found ${notes.length} notes in ${paraFolder}`);

      if (notes.length === 0) {
        console.log(chalk.yellow('\nNo notes found in this folder.'));
        return;
      }

      console.log(chalk.green(`\n📝 Notes in ${paraFolder}:`));
      notes.forEach((note, index) => {
        console.log(chalk.cyan(`\n${index + 1}. ${note.frontmatter.title}`));
        console.log(chalk.gray(`   ID: ${note.frontmatter.id}`));
        console.log(chalk.gray(`   Created: ${note.frontmatter.created}`));
        if (note.frontmatter.tags.length > 0) {
          console.log(chalk.gray(`   Tags: ${note.frontmatter.tags.join(', ')}`));
        }
        const code = [];
        if (note.frontmatter.is_inspiring) code.push('inspiring');
        if (note.frontmatter.is_useful) code.push('useful');
        if (note.frontmatter.is_personal) code.push('personal');
        if (note.frontmatter.is_surprising) code.push('surprising');
        if (code.length > 0) {
          console.log(chalk.gray(`   CODE: ${code.join(', ')}`));
        }
      });
    } catch (error) {
      spinner.fail('Failed to list notes');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Search command
const searchCmd = program
  .command('search')
  .description('Search notes by tag or CODE criteria');

// Search by tag
searchCmd
  .command('tag <tag>')
  .description('Search notes by tag')
  .action(async (tag: string) => {
    const spinner = ora(`Searching for tag "${tag}"...`).start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      NoteService.setVaultPath(config.vaultPath);
      const notes = await NoteService.findByTag(tag);

      spinner.succeed(`Found ${notes.length} notes with tag "${tag}"`);

      if (notes.length === 0) {
        console.log(chalk.yellow(`\nNo notes found with tag "${tag}".`));
        return;
      }

      console.log(chalk.green(`\n🔍 Search results for tag "${tag}":`));
      notes.forEach((note, index) => {
        console.log(chalk.cyan(`\n${index + 1}. ${note.frontmatter.title}`));
        console.log(chalk.gray(`   ID: ${note.frontmatter.id}`));
        console.log(chalk.gray(`   Folder: ${note.frontmatter.para_folder}`));
        console.log(chalk.gray(`   Created: ${note.frontmatter.created}`));
      });
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Search by CODE criteria
searchCmd
  .command('code <criteria>')
  .description('Search notes by CODE criteria (inspiring, useful, personal, surprising)')
  .action(async (criteria: string) => {
    const spinner = ora(`Searching for ${criteria} notes...`).start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      // Validate criteria
      const validCriteria = ['inspiring', 'useful', 'personal', 'surprising'];
      if (!validCriteria.includes(criteria)) {
        spinner.fail(`Invalid criteria. Must be one of: ${validCriteria.join(', ')}`);
        process.exit(1);
      }

      NoteService.setVaultPath(config.vaultPath);

      const searchCriteria: any = {};
      searchCriteria[criteria] = true;

      const notes = await NoteService.findByCODE(searchCriteria);

      spinner.succeed(`Found ${notes.length} ${criteria} notes`);

      if (notes.length === 0) {
        console.log(chalk.yellow(`\nNo ${criteria} notes found.`));
        return;
      }

      console.log(chalk.green(`\n✨ ${criteria.charAt(0).toUpperCase() + criteria.slice(1)} notes:`));
      notes.forEach((note, index) => {
        console.log(chalk.cyan(`\n${index + 1}. ${note.frontmatter.title}`));
        console.log(chalk.gray(`   ID: ${note.frontmatter.id}`));
        console.log(chalk.gray(`   Folder: ${note.frontmatter.para_folder}`));
        console.log(chalk.gray(`   Tags: ${note.frontmatter.tags.join(', ')}`));
      });
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Move command
program
  .command('move <noteId> <folder>')
  .description('Move note to different PARA folder')
  .action(async (noteId: string, folder: string) => {
    const spinner = ora('Moving note...').start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      // Validate folder
      const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive'];
      if (!validFolders.includes(folder)) {
        spinner.fail(`Invalid folder. Must be one of: ${validFolders.join(', ')}`);
        process.exit(1);
      }

      NoteService.setVaultPath(config.vaultPath);

      const note = await NoteService.getById(noteId);
      if (!note) {
        spinner.fail(`Note not found: ${noteId}`);
        process.exit(1);
      }

      const paraFolder = folder as 'inbox' | 'projects' | 'areas' | 'resources' | 'archive';
      await NoteService.moveTo(note, paraFolder);

      spinner.succeed('Note moved successfully');
      console.log(chalk.green(`\n✓ Moved: ${note.frontmatter.title}`));
      console.log(chalk.gray(`  From: ${note.frontmatter.para_folder}`));
      console.log(chalk.gray(`  To: ${paraFolder}`));
    } catch (error) {
      spinner.fail('Failed to move note');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Archive command
program
  .command('archive <noteId>')
  .description('Archive a note or project')
  .action(async (noteId: string) => {
    const spinner = ora('Archiving...').start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      NoteService.setVaultPath(config.vaultPath);
      await NoteService.archive(noteId);

      spinner.succeed('Archived successfully');
      console.log(chalk.green(`\n✓ Note archived: ${noteId}`));
    } catch (error) {
      spinner.fail('Failed to archive');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Project commands
const projectCmd = program
  .command('project')
  .description('Manage projects');

// Create project
projectCmd
  .command('create <name>')
  .description('Create a new project')
  .option('-d, --description <description>', 'Project description')
  .option('-m, --months <months>', 'Deadline in months (default: 3)', '3')
  .action(async (name: string, options: {
    description?: string;
    months?: string;
  }) => {
    const spinner = ora('Creating project...').start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      ProjectService.setVaultPath(config.vaultPath);

      const description = options.description || '';
      const deadlineMonths = parseInt(options.months || '3', 10);

      if (isNaN(deadlineMonths) || deadlineMonths < 1) {
        spinner.fail('Invalid months value. Must be a positive number.');
        process.exit(1);
      }

      const project = await ProjectService.create(name, description, deadlineMonths);

      spinner.succeed('Project created successfully');
      console.log(chalk.green(`\n✓ Project: ${project.metadata.name}`));
      console.log(chalk.gray(`  Description: ${project.metadata.description || 'None'}`));
      console.log(chalk.gray(`  Status: ${project.metadata.status}`));
      console.log(chalk.gray(`  Deadline: ${project.metadata.deadline}`));
      console.log(chalk.gray(`  Path: 1-projects/project-${name}/`));
    } catch (error) {
      spinner.fail('Failed to create project');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// List projects
projectCmd
  .command('list')
  .description('List all projects')
  .action(async () => {
    const spinner = ora('Loading projects...').start();

    try {
      const validation = await validateVaultStructure();
      if (!validation.valid) {
        spinner.fail('Vault not initialized. Run "pensieve init" first.');
        process.exit(1);
      }

      ProjectService.setVaultPath(config.vaultPath);
      const projects = await ProjectService.list();

      spinner.succeed(`Found ${projects.length} projects`);

      if (projects.length === 0) {
        console.log(chalk.yellow('\nNo projects found. Create one with "pensieve project create <name>"'));
        return;
      }

      console.log(chalk.green(`\n📁 Projects:`));

      const activeProjects = projects.filter(p => p.status === 'active');
      const otherProjects = projects.filter(p => p.status !== 'active');

      if (activeProjects.length > 0) {
        console.log(chalk.bold.cyan('\n🚀 Active:'));
        activeProjects.forEach((project, index) => {
          console.log(chalk.cyan(`\n${index + 1}. ${project.name}`));
          console.log(chalk.gray(`   Description: ${project.description || 'None'}`));
          console.log(chalk.gray(`   Progress: ${project.progress}%`));
          console.log(chalk.gray(`   Deadline: ${project.deadline}`));
        });
      }

      if (otherProjects.length > 0) {
        console.log(chalk.bold.gray('\n📦 Other:'));
        otherProjects.forEach((project, index) => {
          console.log(chalk.gray(`\n${index + 1}. ${project.name}`));
          console.log(chalk.gray(`   Description: ${project.description || 'None'}`));
          console.log(chalk.gray(`   Status: ${project.status}`));
          console.log(chalk.gray(`   Progress: ${project.progress}%`));
        });
      }
    } catch (error) {
      spinner.fail('Failed to list projects');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse(process.argv);
