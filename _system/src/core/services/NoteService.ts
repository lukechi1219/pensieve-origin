import path from 'path';
import { Note, NoteFrontmatter } from '../models/Note';
import { parseFrontmatter, serializeFrontmatter } from '../utils/frontmatterParser';
import {
  readFile,
  writeFile,
  fileExists,
  listFiles,
  moveFile,
  deleteFile,
} from '../utils/fileSystem';
import { generateTimestampId } from '../utils/dateUtils';

export class NoteService {
  private static vaultPath: string = process.env.VAULT_PATH || './vault';
  private static notesCache: Note[] | null = null;

  /**
   * Set vault path
   */
  static setVaultPath(vaultPath: string): void {
    this.vaultPath = vaultPath;
  }

  /**
   * Invalidate the cache
   */
  private static invalidateCache(): void {
    this.notesCache = null;
  }

  /**
   * Get all notes (with caching)
   */
  private static async getAllNotes(): Promise<Note[]> {
    if (this.notesCache) {
      return this.notesCache;
    }

    const allNotes: Note[] = [];
    const folders = ['0-inbox', '1-projects', '2-areas', '3-resources', '4-archive'];

    for (const folder of folders) {
      const folderPath = path.join(this.vaultPath, folder);
      const files = await listFiles(folderPath, { recursive: true, extension: '.md' });

      for (const filePath of files) {
        try {
          // Optimization: Could read file content only when needed, but for filtering we need frontmatter
          // For now, load full note. Future optimization: Load only frontmatter for cache index.
          const note = await this.getByPath(filePath);
          allNotes.push(note);
        } catch (e) {
          // Skip invalid files
        }
      }
    }

    this.notesCache = allNotes;
    return this.notesCache;
  }

  /**
   * Generate note file name from ID and title
   */
  private static generateFileName(id: string, title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    return `${id}-${slug}.md`;
  }

  /**
   * Get full file path for a note
   */
  private static getNotePath(note: Note): string {
    const fileName = this.generateFileName(note.frontmatter.id, note.frontmatter.title);
    return path.join(this.vaultPath, note.frontmatter.para_path, fileName);
  }

  /**
   * Create a new note
   */
  static async create(
    title: string,
    content: string,
    options?: {
      tags?: string[];
      isInspiring?: boolean;
      isUseful?: boolean;
      isPersonal?: boolean;
      isSurprising?: boolean;
    }
  ): Promise<Note> {
    const id = generateTimestampId();
    const note = Note.create(title, content, id);

    // Apply options if provided
    if (options) {
      if (options.tags) {
        note.frontmatter.tags = options.tags;
      }
      if (options.isInspiring !== undefined) {
        note.frontmatter.is_inspiring = options.isInspiring;
      }
      if (options.isUseful !== undefined) {
        note.frontmatter.is_useful = options.isUseful;
      }
      if (options.isPersonal !== undefined) {
        note.frontmatter.is_personal = options.isPersonal;
      }
      if (options.isSurprising !== undefined) {
        note.frontmatter.is_surprising = options.isSurprising;
      }
    }

    const filePath = this.getNotePath(note);
    const fileContent = serializeFrontmatter(note.frontmatter, note.content);

    await writeFile(filePath, fileContent);
    note.filePath = filePath;

    this.invalidateCache();
    return note;
  }

  /**
   * Get note by ID
   */
  static async getById(noteId: string): Promise<Note | null> {
    const notes = await this.getAllNotes();
    return notes.find(n => n.frontmatter.id === noteId) || null;
  }

  /**
   * Get note by file path
   */
  static async getByPath(filePath: string): Promise<Note> {
    const content = await readFile(filePath);
    const parsed = parseFrontmatter(content);

    return new Note(parsed.frontmatter as NoteFrontmatter, parsed.content, filePath);
  }

  /**
   * List all notes in a PARA folder
   */
  static async listByFolder(
    paraFolder: NoteFrontmatter['para_folder']
  ): Promise<Note[]> {
    const notes = await this.getAllNotes();
    return notes.filter(n => n.frontmatter.para_folder === paraFolder);
  }

  /**
   * Search notes by tag
   */
  static async findByTag(tag: string): Promise<Note[]> {
    const notes = await this.getAllNotes();
    return notes.filter(note => note.frontmatter.tags.includes(tag));
  }

  /**
   * Search notes by CODE criteria
   */
  static async findByCODE(criteria: {
    inspiring?: boolean;
    useful?: boolean;
    personal?: boolean;
    surprising?: boolean;
  }): Promise<Note[]> {
    const notes = await this.getAllNotes();

    return notes.filter(note => {
      if (criteria.inspiring && !note.frontmatter.is_inspiring) return false;
      if (criteria.useful && !note.frontmatter.is_useful) return false;
      if (criteria.personal && !note.frontmatter.is_personal) return false;
      if (criteria.surprising && !note.frontmatter.is_surprising) return false;
      return true;
    });
  }

  /**
   * Update note
   */
  static async update(note: Note): Promise<void> {
    if (!note.filePath) {
      throw new Error('Cannot update note without filePath');
    }

    note.touch();
    const fileContent = serializeFrontmatter(note.frontmatter, note.content);
    await writeFile(note.filePath, fileContent);
    this.invalidateCache();
  }

  /**
   * Move note to different PARA folder
   */
  static async moveTo(
    note: Note,
    paraFolder: NoteFrontmatter['para_folder'],
    subPath: string = ''
  ): Promise<void> {
    if (!note.filePath) {
      throw new Error('Cannot move note without filePath');
    }

    const folderMap = {
      inbox: '0-inbox',
      projects: '1-projects',
      areas: '2-areas',
      resources: '3-resources',
      archive: '4-archive',
    };

    const paraPath = path.join(folderMap[paraFolder], subPath);
    note.moveTo(paraFolder, paraPath);

    const newFilePath = this.getNotePath(note);
    await moveFile(note.filePath, newFilePath);

    note.filePath = newFilePath;
    this.invalidateCache();
  }

  /**
   * Delete note
   */
  static async delete(note: Note): Promise<void> {
    if (!note.filePath) {
      throw new Error('Cannot delete note without filePath');
    }

    await deleteFile(note.filePath);
    this.invalidateCache();
  }

  /**
   * Update distillation level (for Progressive Summarization)
   */
  static async updateDistillation(
    noteId: string,
    summary: string,
    level: NoteFrontmatter['distillation_level']
  ): Promise<void> {
    const note = await this.getById(noteId);
    if (!note) {
      throw new Error(`Note not found: ${noteId}`);
    }

    const typeMap: Record<number, 'captured' | 'highlighted' | 'summarized' | 'remixed'> = {
      0: 'captured',
      1: 'captured',
      2: 'highlighted',
      3: 'summarized',
      4: 'remixed',
    };

    note.updateDistillation(level, typeMap[level], summary);
    await this.update(note);
  }

  /**
   * Archive note
   */
  static async archive(noteId: string): Promise<void> {
    const note = await this.getById(noteId);
    if (!note) {
      throw new Error(`Note not found: ${noteId}`);
    }

    await this.moveTo(note, 'archive');
    note.archive();
    await this.update(note);
  }
}
