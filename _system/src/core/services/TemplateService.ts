import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Template Schema Interfaces
 */
interface TemplateMetadata {
  schema_version: string;
  metadata: Record<string, any>;
  sections: TemplateSection[];
}

interface TemplateSection {
  name: string;
  type: 'section' | 'subsection' | 'heading1' | 'heading2';
  content?: TemplateContent[];
}

type TemplateContent =
  | PromptContent
  | SubsectionContent
  | ChecklistContent
  | FieldContent
  | FreeformContent;

interface PromptContent {
  type: 'prompt';
  label: string;
  format: 'text' | 'ordered_list' | 'scale';
  items?: number;
  scale?: string;
  hint?: string;
}

interface SubsectionContent {
  type: 'subsection';
  title: string;
  format?: 'bullet_list';
  items?: number;
  placeholder?: string;
}

interface ChecklistContent {
  type: 'checklist';
  items: string[];
}

interface FieldContent {
  type: 'field';
  label: string;
}

interface FreeformContent {
  type: 'freeform';
  placeholder?: string;
}

/**
 * TemplateService
 *
 * Manages YAML-based templates for notes, journals, and projects.
 * Provides template loading, variable interpolation, and Markdown generation.
 */
export class TemplateService {
  private templatesDir: string;

  constructor(vaultPath: string) {
    this.templatesDir = path.join(vaultPath, 'templates');
  }

  /**
   * Load a template by name
   */
  async load(templateName: string): Promise<TemplateMetadata> {
    const templatePath = path.join(this.templatesDir, `${templateName}.yaml`);

    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      const template = yaml.load(content) as TemplateMetadata;

      if (!template.schema_version) {
        throw new Error(`Template ${templateName} missing schema_version`);
      }

      return template;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Template not found: ${templateName}`);
      }
      throw error;
    }
  }

  /**
   * Instantiate a template with variables
   * Returns a complete Markdown file with YAML frontmatter
   */
  async instantiate(
    templateName: string,
    variables: Record<string, any>
  ): Promise<string> {
    const template = await this.load(templateName);

    // Interpolate variables in metadata
    const metadata = this.interpolateObject(template.metadata, variables);

    // Generate Markdown body from sections
    const body = this.generateMarkdown(template.sections, variables);

    // Combine frontmatter + body
    return this.formatDocument(metadata, body);
  }

  /**
   * Interpolate variables in an object (recursive)
   */
  private interpolateObject(
    obj: any,
    variables: Record<string, any>
  ): any {
    if (typeof obj === 'string') {
      return this.interpolateString(obj, variables);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, variables));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, variables);
      }
      return result;
    }

    return obj;
  }

  /**
   * Interpolate variables in a string
   * Replaces {{variable}} with variable value
   */
  private interpolateString(str: string, variables: Record<string, any>): string {
    return str.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }

  /**
   * Generate Markdown body from sections
   */
  private generateMarkdown(
    sections: TemplateSection[],
    variables: Record<string, any>
  ): string {
    const lines: string[] = [];

    for (const section of sections) {
      // Section heading
      if (section.type === 'heading1') {
        lines.push(`# ${this.interpolateString(section.name, variables)}`);
        lines.push('');
      } else if (section.type === 'section') {
        lines.push(`## ${section.name}`);
        lines.push('');
      } else if (section.type === 'subsection') {
        lines.push(`### ${section.name}`);
        lines.push('');
      }

      // Section content
      if (section.content) {
        for (const content of section.content) {
          lines.push(...this.generateContent(content, variables));
        }
      }

      lines.push('');
    }

    return lines.join('\n').trim();
  }

  /**
   * Generate Markdown for a content block
   */
  private generateContent(
    content: TemplateContent,
    variables: Record<string, any>
  ): string[] {
    const lines: string[] = [];

    switch (content.type) {
      case 'prompt':
        lines.push(`**${content.label}:**`);
        if (content.hint) {
          lines.push(`${content.hint}`);
        }
        lines.push('');

        if (content.format === 'ordered_list' && content.items) {
          for (let i = 1; i <= content.items; i++) {
            lines.push(`${i}.`);
          }
        } else if (content.format === 'scale' && content.scale) {
          lines.push(content.scale);
        }

        lines.push('');
        break;

      case 'subsection':
        lines.push(`### ${content.title}`);
        lines.push('');

        if (content.format === 'bullet_list') {
          if (content.items) {
            for (let i = 0; i < content.items; i++) {
              lines.push('-');
            }
          } else if (content.placeholder) {
            lines.push(content.placeholder);
          }
          lines.push('');
        }
        break;

      case 'checklist':
        for (const item of content.items) {
          lines.push(`- [ ] ${item}`);
        }
        lines.push('');
        break;

      case 'field':
        lines.push(`- **${content.label}**:`);
        break;

      case 'freeform':
        if (content.placeholder) {
          lines.push(content.placeholder);
        }
        lines.push('');
        break;
    }

    return lines;
  }

  /**
   * Format complete document with frontmatter
   */
  private formatDocument(metadata: Record<string, any>, body: string): string {
    const frontmatter = yaml.dump(metadata, {
      lineWidth: -1,
      noRefs: true,
    });

    return `---\n${frontmatter}---\n\n${body}`;
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesDir);
      return files
        .filter(file => file.endsWith('.yaml'))
        .map(file => path.basename(file, '.yaml'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get template metadata only (no instantiation)
   */
  async getMetadata(templateName: string): Promise<Record<string, any>> {
    const template = await this.load(templateName);
    return template.metadata;
  }
}
