import { Router, Request, Response } from 'express';
import { NoteService } from '../../core/services/NoteService.js';
import { config } from '../../core/utils/config.js';

const router = Router();

// Set vault path
NoteService.setVaultPath(config.vaultPath);

/**
 * GET /api/notes
 * List all notes or filter by folder/tag/CODE criteria
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { folder, tag, code } = req.query;

    let notes;

    if (folder) {
      const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive'];
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
      const folders = ['inbox', 'projects', 'areas', 'resources', 'archive'] as const;
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
router.get('/:id', async (req: Request, res: Response) => {
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, tags, isInspiring, isUseful, isPersonal, isSurprising } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'title and content are required',
      });
    }

    const note = await NoteService.create(title, content, {
      tags: tags || [],
      isInspiring: isInspiring || false,
      isUseful: isUseful || false,
      isPersonal: isPersonal || false,
      isSurprising: isSurprising || false,
    });

    res.status(201).json({
      message: 'Note created successfully',
      note: {
        id: note.frontmatter.id,
        title: note.frontmatter.title,
        created: note.frontmatter.created,
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
router.put('/:id', async (req: Request, res: Response) => {
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
        modified: note.frontmatter.modified,
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
router.delete('/:id', async (req: Request, res: Response) => {
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
 */
router.post('/:id/move', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { folder, subPath } = req.body;

    const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive'];
    if (!validFolders.includes(folder)) {
      return res.status(400).json({
        error: 'Invalid folder',
        message: `Folder must be one of: ${validFolders.join(', ')}`,
      });
    }

    const note = await NoteService.getById(id);
    if (!note) {
      return res.status(404).json({
        error: 'Note not found',
        message: `No note found with ID: ${id}`,
      });
    }

    const originalFolder = note.frontmatter.para_folder; // Store original folder

    await NoteService.moveTo(note, folder as any, subPath);

    res.json({
      message: 'Note moved successfully',
      from: originalFolder,
      to: folder,
      subPath,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to move note',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
