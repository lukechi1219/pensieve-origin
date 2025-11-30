import { Router, Request, Response } from 'express';
import { NoteService } from '../../core/services/NoteService.js';
import { config } from '../../core/utils/config.js';
import { validatePARAFolder } from '../../core/utils/pathSecurity.js';
import {
  validateBody,
  validateParams,
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
  moveNoteSchema,
} from '../middleware/validation.js';

const router = Router();

// Set vault path
NoteService.setVaultPath(config.vaultPath);

/**
 * GET /api/notes/subfolders
 * List subfolders in a PARA folder with note counts
 */
router.get('/subfolders', async (req: Request, res: Response) => {
  try {
    const { folder } = req.query;

    if (!folder) {
      return res.status(400).json({
        error: 'Missing folder parameter',
        message: 'folder is required',
      });
    }

    const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive', 'people'];
    if (!validFolders.includes(folder as string)) {
      return res.status(400).json({
        error: 'Invalid folder',
        message: `Folder must be one of: ${validFolders.join(', ')}`,
      });
    }

    const subfolders = await NoteService.listSubfolders(folder as any);

    res.json({
      folder,
      count: subfolders.length,
      subfolders,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list subfolders',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/notes
 * List all notes or filter by folder/tag/CODE criteria
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { folder, tag, code } = req.query;

    let notes;

    if (folder) {
      const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive', 'people'];
      if (!validFolders.includes(folder as string)) {
        return res.status(400).json({
          error: 'Invalid folder',
          message: `Folder must be one of: ${validFolders.join(', ')}`,
        });
      }
      notes = await NoteService.listByFolder(folder as any);
    } else if (tag) {
      notes = await NoteService.findByTag(tag as string);
    } else if (code) {
      const validCode = ['inspiring', 'useful', 'personal', 'surprising'];
      if (!validCode.includes(code as string)) {
        return res.status(400).json({
          error: 'Invalid CODE criteria',
          message: `Must be one of: ${validCode.join(', ')}`,
        });
      }
      const criteria: any = {};
      criteria[code as string] = true;
      notes = await NoteService.findByCODE(criteria);
    } else {
      // Get all notes from all folders
      const allNotes = [];
      const folders = ['inbox', 'projects', 'areas', 'resources', 'archive', 'people'] as const;
      for (const f of folders) {
        const folderNotes = await NoteService.listByFolder(f);
        allNotes.push(...folderNotes);
      }
      notes = allNotes;
    }

    res.json({
      count: notes.length,
      notes: notes.map(note => ({
        id: note.frontmatter.id,
        title: note.frontmatter.title,
        created: note.frontmatter.created,
        modified: note.frontmatter.modified,
        tags: note.frontmatter.tags,
        paraFolder: note.frontmatter.para_folder,
        paraPath: note.frontmatter.para_path,
        distillationLevel: note.frontmatter.distillation_level,
        isInspiring: note.frontmatter.is_inspiring,
        isUseful: note.frontmatter.is_useful,
        isPersonal: note.frontmatter.is_personal,
        isSurprising: note.frontmatter.is_surprising,
        status: note.frontmatter.status,
        filePath: note.filePath,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch notes',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/notes/:id
 * Get a specific note by ID
 */
router.get('/:id', validateParams(noteIdSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await NoteService.getById(id);

    if (!note) {
      return res.status(404).json({
        error: 'Note not found',
        message: `No note found with ID: ${id}`,
      });
    }

    res.json({
      id: note.frontmatter.id,
      title: note.frontmatter.title,
      content: note.content,
      created: note.frontmatter.created,
      modified: note.frontmatter.modified,
      tags: note.frontmatter.tags,
      paraFolder: note.frontmatter.para_folder,
      paraPath: note.frontmatter.para_path,
      distillationLevel: note.frontmatter.distillation_level,
      distillationHistory: note.frontmatter.distillation_history,
      isInspiring: note.frontmatter.is_inspiring,
      isUseful: note.frontmatter.is_useful,
      isPersonal: note.frontmatter.is_personal,
      isSurprising: note.frontmatter.is_surprising,
      status: note.frontmatter.status,
      filePath: note.filePath,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch note',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', validateBody(createNoteSchema), async (req: Request, res: Response) => {
  try {
    const { title, content, tags, isInspiring, isUseful, isPersonal, isSurprising, folder, subPath } = req.body;

    let note;

    if (folder === 'people') {
      // Use person template for people
      note = await NoteService.createFromTemplate(title, 'person', {
        tags: tags || [],
        isInspiring: isInspiring || false,
        isUseful: isUseful || false,
        isPersonal: isPersonal || true, // People are personal by default
        isSurprising: isSurprising || false,
        folder,
        subPath,
      });
      
      // If content is provided (e.g. from quick capture), append it or replace freeform
      // But usually creation from template ignores initial content unless we inject it.
      // For now, we rely on the template.
    } else {
      note = await NoteService.create(title, content || '', {
        tags: tags || [],
        isInspiring: isInspiring || false,
        isUseful: isUseful || false,
        isPersonal: isPersonal || false,
        isSurprising: isSurprising || false,
        folder,
        subPath,
      });
    }

    res.status(201).json({
      message: 'Note created successfully',
      note: {
        id: note.frontmatter.id,
        title: note.frontmatter.title,
        content: note.content,
        created: note.frontmatter.created,
        modified: note.frontmatter.modified,
        tags: note.frontmatter.tags,
        paraFolder: note.frontmatter.para_folder,
        paraPath: note.frontmatter.para_path,
        distillationLevel: note.frontmatter.distillation_level,
        distillationHistory: note.frontmatter.distillation_history,
        isInspiring: note.frontmatter.is_inspiring,
        isUseful: note.frontmatter.is_useful,
        isPersonal: note.frontmatter.is_personal,
        isSurprising: note.frontmatter.is_surprising,
        status: note.frontmatter.status,
        filePath: note.filePath,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create note',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/notes/:id
 * Update a note
 */
router.put('/:id', validateParams(noteIdSchema), validateBody(updateNoteSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, tags } = req.body;

    const note = await NoteService.getById(id);
    if (!note) {
      return res.status(404).json({
        error: 'Note not found',
        message: `No note found with ID: ${id}`,
      });
    }

    if (content !== undefined) {
      note.content = content;
    }

    if (tags !== undefined) {
      note.frontmatter.tags = tags;
    }

    await NoteService.update(note);

    res.json({
      message: 'Note updated successfully',
      note: {
        id: note.frontmatter.id,
        title: note.frontmatter.title,
        content: note.content,
        created: note.frontmatter.created,
        modified: note.frontmatter.modified,
        tags: note.frontmatter.tags,
        paraFolder: note.frontmatter.para_folder,
        paraPath: note.frontmatter.para_path,
        distillationLevel: note.frontmatter.distillation_level,
        distillationHistory: note.frontmatter.distillation_history,
        isInspiring: note.frontmatter.is_inspiring,
        isUseful: note.frontmatter.is_useful,
        isPersonal: note.frontmatter.is_personal,
        isSurprising: note.frontmatter.is_surprising,
        status: note.frontmatter.status,
        filePath: note.filePath,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update note',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', validateParams(noteIdSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const note = await NoteService.getById(id);
    if (!note) {
      return res.status(404).json({
        error: 'Note not found',
        message: `No note found with ID: ${id}`,
      });
    }

    await NoteService.delete(note);

    res.json({
      message: 'Note deleted successfully',
      id,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete note',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/notes/:id/move
 * Move note to different folder
 *
 * SECURITY: Protected against path traversal (VULN-002)
 * - Validates folder parameter via Zod schema
 * - Validates subPath length via Zod schema
 * - Logs security violations
 * - NoteService.moveTo() performs additional validation
 */
router.post('/:id/move', validateParams(noteIdSchema), validateBody(moveNoteSchema), async (req: Request, res: Response) => {
  // Declare variables outside try block for error handler access
  const { id } = req.params;
  const { folder, subPath } = req.body;

  try {

    const note = await NoteService.getById(id);
    if (!note) {
      return res.status(404).json({
        error: 'Note not found',
        message: `No note found with ID: ${id}`,
      });
    }

    const originalFolder = note.frontmatter.para_folder; // Store original folder

    // NoteService.moveTo() will validate path and prevent traversal
    await NoteService.moveTo(note, folder, subPath);

    res.json({
      message: 'Note moved successfully',
      note: {
        id: note.frontmatter.id,
        title: note.frontmatter.title,
        content: note.content,
        created: note.frontmatter.created,
        modified: note.frontmatter.modified,
        tags: note.frontmatter.tags,
        paraFolder: note.frontmatter.para_folder,
        paraPath: note.frontmatter.para_path,
        distillationLevel: note.frontmatter.distillation_level,
        distillationHistory: note.frontmatter.distillation_history,
        isInspiring: note.frontmatter.is_inspiring,
        isUseful: note.frontmatter.is_useful,
        isPersonal: note.frontmatter.is_personal,
        isSurprising: note.frontmatter.is_surprising,
        status: note.frontmatter.status,
        filePath: note.filePath,
      },
    });
  } catch (error: any) {
    // SECURITY: Log path traversal attempts
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes('not allowed') ||
      errorMessage.includes('outside vault') ||
      errorMessage.includes('Security violation') ||
      errorMessage.includes('traversal')
    ) {
      console.warn(
        `[SECURITY] Path traversal attempt blocked:`,
        `noteId=${id},`,
        `folder=${folder},`,
        `subPath=${subPath},`,
        `error=${errorMessage}`
      );
      return res.status(400).json({
        error: 'Invalid path',
        message: 'The specified path is not allowed',
      });
    }

    // Other errors
    console.error('Move note error:', errorMessage);
    res.status(500).json({
      error: 'Failed to move note',
      message: errorMessage,
    });
  }
});

export default router;
