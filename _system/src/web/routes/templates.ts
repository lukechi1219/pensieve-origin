import { Router, Request, Response } from 'express';
import { TemplateService } from '../../core/services/TemplateService';

const router = Router();
const vaultPath = process.env.VAULT_PATH || './vault';
const templateService = new TemplateService(vaultPath);

/**
 * GET /api/templates
 * List all available templates
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await templateService.listTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({
      error: 'Failed to list templates',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/templates/:templateName
 * Get template metadata
 */
router.get('/:templateName', async (req: Request, res: Response) => {
  try {
    const { templateName } = req.params;
    const metadata = await templateService.getMetadata(templateName);
    res.json({ templateName, metadata });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        error: 'Template not found',
        message: error.message,
      });
    } else {
      console.error('Error getting template:', error);
      res.status(500).json({
        error: 'Failed to get template',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

/**
 * POST /api/templates/:templateName/instantiate
 * Instantiate a template with variables
 *
 * Request body:
 * {
 *   "variables": {
 *     "key": "value",
 *     ...
 *   }
 * }
 */
router.post('/:templateName/instantiate', async (req: Request, res: Response) => {
  try {
    const { templateName } = req.params;
    const { variables } = req.body;

    if (!variables || typeof variables !== 'object') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain "variables" object',
      });
      return;
    }

    const content = await templateService.instantiate(templateName, variables);
    res.json({
      templateName,
      variables,
      content,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        error: 'Template not found',
        message: error.message,
      });
    } else {
      console.error('Error instantiating template:', error);
      res.status(500).json({
        error: 'Failed to instantiate template',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

export default router;
