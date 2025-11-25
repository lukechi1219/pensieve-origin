import { Router, Request, Response } from 'express';
import { ProjectService } from '../../core/services/ProjectService.js';
import { config } from '../../core/utils/config.js';

const router = Router();

// Set vault path
ProjectService.setVaultPath(config.vaultPath);

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await ProjectService.list();

    res.json({
      count: projects.length,
      projects: projects.map(project => ({
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        deadline: project.deadline,
        path: project.path,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch projects',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/projects/:name
 * Get a specific project by name
 */
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const project = await ProjectService.getByName(name);

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `No project found with name: ${name}`,
      });
    }

    res.json({
      name: project.metadata.name,
      status: project.metadata.status,
      created: project.metadata.created,
      deadline: project.metadata.deadline,
      completionDate: project.metadata.completion_date,
      description: project.metadata.description,
      goal: project.metadata.goal,
      successCriteria: project.metadata.success_criteria,
      relatedAreas: project.metadata.related_areas,
      tags: project.metadata.tags,
      notes: project.metadata.notes,
      progress: {
        percentComplete: project.metadata.progress.percent_complete,
        lastUpdated: project.metadata.progress.last_updated,
        milestones: project.metadata.progress.milestones,
      },
      archive: project.metadata.archive,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch project',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, deadlineMonths } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'name is required',
      });
    }

    const project = await ProjectService.create(
      name,
      description || '',
      deadlineMonths || 3
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        name: project.metadata.name,
        status: project.metadata.status,
        deadline: project.metadata.deadline,
        description: project.metadata.description,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create project',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/projects/:name
 * Update project metadata
 */
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { description, goal, successCriteria, relatedAreas, tags, notes } = req.body;

    const project = await ProjectService.getByName(name);
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `No project found with name: ${name}`,
      });
    }

    if (description !== undefined) project.metadata.description = description;
    if (goal !== undefined) project.metadata.goal = goal;
    if (successCriteria !== undefined) project.metadata.success_criteria = successCriteria;
    if (relatedAreas !== undefined) project.metadata.related_areas = relatedAreas;
    if (tags !== undefined) project.metadata.tags = tags;
    if (notes !== undefined) project.metadata.notes = notes;

    await ProjectService.update(name, project);

    res.json({
      message: 'Project updated successfully',
      project: {
        name: project.metadata.name,
        description: project.metadata.description,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update project',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/projects/:name/progress
 * Update project progress
 */
router.post('/:name/progress', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        error: 'Invalid progress',
        message: 'Progress must be between 0 and 100',
      });
    }

    await ProjectService.updateProgress(name, progress);

    res.json({
      message: 'Progress updated successfully',
      progress,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update progress',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/projects/:name/milestones
 * Add milestone to project
 */
router.post('/:name/milestones', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { milestoneName, dueDate } = req.body;

    if (!milestoneName) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'milestoneName is required',
      });
    }

    await ProjectService.addMilestone(name, milestoneName, dueDate || '');

    res.json({
      message: 'Milestone added successfully',
      milestone: {
        name: milestoneName,
        dueDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add milestone',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/projects/:name/complete
 * Mark project as complete
 */
router.post('/:name/complete', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { outcome } = req.body;

    await ProjectService.complete(name, outcome || '');

    res.json({
      message: 'Project completed successfully',
      name,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to complete project',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/projects/:name/archive
 * Archive project
 */
router.post('/:name/archive', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { reason, lessonsLearned } = req.body;

    const validReasons = ['completed', 'cancelled', 'merged'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        error: 'Invalid reason',
        message: `Reason must be one of: ${validReasons.join(', ')}`,
      });
    }

    await ProjectService.archive(name, reason, lessonsLearned);

    res.json({
      message: 'Project archived successfully',
      name,
      reason,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to archive project',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
