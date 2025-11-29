import path from 'path';
import { Project, ProjectMetadata } from '../models/Project';
import { readFile, writeFile, fileExists, listFiles, ensureDir } from '../utils/fileSystem';
import { sanitizeProjectName, validatePathWithinBase } from '../utils/pathSecurity';

export interface ProjectListItem {
  name: string;
  status: 'active' | 'on-hold' | 'completed';
  progress: number;
  deadline: string;
  description: string;
  path: string;
}

export class ProjectService {
  private static vaultPath: string = process.env.VAULT_PATH || './vault';

  /**
   * Set vault path
   */
  static setVaultPath(vaultPath: string): void {
    this.vaultPath = vaultPath;
  }

  /**
   * Get projects folder path
   */
  private static getProjectsPath(): string {
    return path.join(this.vaultPath, '1-projects');
  }

  /**
   * Get project directory path
   *
   * SECURITY: Protected against path traversal attacks (VULN-002)
   * - Sanitizes projectName to reject ../, slashes, and absolute paths
   */
  private static getProjectPath(projectName: string): string {
    const safeName = sanitizeProjectName(projectName);
    return path.join(this.getProjectsPath(), `project-${safeName}`);
  }

  /**
   * Get project.yaml file path
   */
  private static getProjectYamlPath(projectName: string): string {
    return path.join(this.getProjectPath(projectName), 'project.yaml');
  }

  /**
   * Create a new project
   */
  static async create(
    name: string,
    description: string,
    deadlineMonths: number = 3
  ): Promise<Project> {
    const projectPath = this.getProjectPath(name);
    const yamlPath = this.getProjectYamlPath(name);

    // Check if project already exists
    if (await fileExists(yamlPath)) {
      throw new Error(`Project "${name}" already exists`);
    }

    // Create project directory structure
    await ensureDir(projectPath);
    await ensureDir(path.join(projectPath, 'notes'));
    await ensureDir(path.join(projectPath, 'assets'));

    // Create project metadata
    const project = Project.create(name, description, deadlineMonths);
    project.dirPath = projectPath;

    // Write project.yaml
    const yamlContent = project.toYAML();
    await writeFile(yamlPath, yamlContent);

    return project;
  }

  /**
   * Get project by name
   */
  static async getByName(name: string): Promise<Project | null> {
    const yamlPath = this.getProjectYamlPath(name);

    if (!(await fileExists(yamlPath))) {
      return null;
    }

    const yamlContent = await readFile(yamlPath);
    return Project.fromYAML(yamlContent);
  }

  /**
   * List all projects
   */
  static async list(): Promise<ProjectListItem[]> {
    const projectsPath = this.getProjectsPath();

    // Use fs.readdir to get directories
    const fs = await import('fs/promises');
    const entries = await fs.readdir(projectsPath, { withFileTypes: true });

    const projects: ProjectListItem[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const dirName = entry.name;

      // Check if it's a project directory (starts with "project-")
      if (!dirName.startsWith('project-')) {
        continue;
      }

      const projectName = dirName.replace('project-', '');
      const dirPath = path.join(projectsPath, dirName);
      const yamlPath = path.join(dirPath, 'project.yaml');

      if (await fileExists(yamlPath)) {
        try {
          const yamlContent = await readFile(yamlPath);
          const project = Project.fromYAML(yamlContent);

          projects.push({
            name: projectName,
            status: project.metadata.status,
            progress: project.metadata.progress.percent_complete,
            deadline: project.metadata.deadline,
            description: project.metadata.description,
            path: dirPath,
          });
        } catch (error) {
          // Skip invalid project files
          console.error(`Error loading project ${projectName}:`, error);
        }
      }
    }

    // Sort by status (active first) then by deadline
    return projects.sort((a, b) => {
      // Active projects first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;

      // Then by deadline
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      return 0;
    });
  }

  /**
   * Update project
   */
  static async update(projectName: string, project: Project): Promise<void> {
    const yamlPath = this.getProjectYamlPath(projectName);

    if (!(await fileExists(yamlPath))) {
      throw new Error(`Project "${projectName}" not found`);
    }

    const yamlContent = project.toYAML();
    await writeFile(yamlPath, yamlContent);
  }

  /**
   * Update project progress
   */
  static async updateProgress(projectName: string, progress: number): Promise<void> {
    const project = await this.getByName(projectName);
    if (!project) {
      throw new Error(`Project "${projectName}" not found`);
    }

    project.updateProgress(progress);
    await this.update(projectName, project);
  }

  /**
   * Add milestone to project
   */
  static async addMilestone(
    projectName: string,
    name: string,
    dueDate: string
  ): Promise<void> {
    const project = await this.getByName(projectName);
    if (!project) {
      throw new Error(`Project "${projectName}" not found`);
    }

    project.addMilestone(name, dueDate);
    await this.update(projectName, project);
  }

  /**
   * Complete milestone
   */
  static async completeMilestone(projectName: string, milestoneName: string): Promise<void> {
    const project = await this.getByName(projectName);
    if (!project) {
      throw new Error(`Project "${projectName}" not found`);
    }

    const milestone = project.metadata.progress.milestones.find(m => m.name === milestoneName);
    if (!milestone) {
      throw new Error(`Milestone "${milestoneName}" not found`);
    }

    milestone.completed = true;
    await this.update(projectName, project);
  }

  /**
   * Complete project
   */
  static async complete(projectName: string, outcome: string): Promise<void> {
    const project = await this.getByName(projectName);
    if (!project) {
      throw new Error(`Project "${projectName}" not found`);
    }

    project.complete(outcome);
    await this.update(projectName, project);
  }

  /**
   * Archive project (move to archive folder)
   *
   * SECURITY: Protected against path traversal attacks (VULN-002)
   * - Sanitizes projectName via getProjectPath()
   * - Validates archive destination is within vault
   */
  static async archive(
    projectName: string,
    reason: 'completed' | 'cancelled' | 'merged',
    lessonsLearned?: string
  ): Promise<void> {
    // SECURITY: This will sanitize projectName
    const project = await this.getByName(projectName);
    if (!project) {
      throw new Error(`Project "${projectName}" not found`);
    }

    // Archive the project metadata
    project.archive(reason, lessonsLearned || '');
    await this.update(projectName, project);

    // Move project directory to archive
    const currentPath = this.getProjectPath(projectName); // Already sanitized
    const safeName = sanitizeProjectName(projectName); // Sanitize again for archive path
    const archivePath = path.join(
      this.vaultPath,
      '4-archive',
      `${new Date().toISOString().split('T')[0].slice(0, 7)}-${safeName}`
    );

    // SECURITY FIX: Validate archive destination is within vault
    await validatePathWithinBase(archivePath, this.vaultPath);

    // Note: This requires a move directory function
    // For now, we'll just update the metadata
    // The physical move can be done manually or with a future enhancement
  }

  /**
   * Delete project
   */
  static async delete(projectName: string): Promise<void> {
    const yamlPath = this.getProjectYamlPath(projectName);

    if (!(await fileExists(yamlPath))) {
      throw new Error(`Project "${projectName}" not found`);
    }

    // For safety, we only delete the YAML file
    // The directory and notes can be manually cleaned up
    // This prevents accidental data loss
    const project = await this.getByName(projectName);
    if (project && project.metadata.status === 'active') {
      throw new Error('Cannot delete active project. Archive or cancel it first.');
    }

    // Delete would require a deleteFile utility
    // For now, throw error suggesting manual deletion
    throw new Error(
      'Project deletion is not yet implemented. Please manually delete the project directory.'
    );
  }
}
