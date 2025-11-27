import path from 'path';
import fs from 'fs/promises';

/**
 * Security utilities for path validation and sanitization
 *
 * Protects against:
 * - Path traversal attacks (CWE-22)
 * - Symlink attacks
 * - Absolute path injection
 */

/**
 * Sanitize and validate a subPath to prevent directory traversal
 *
 * @param subPath - User-provided path component (e.g., "project-name/subfolder")
 * @returns Sanitized subPath
 * @throws Error if subPath contains malicious patterns
 */
export function sanitizeSubPath(subPath: string | undefined): string {
  // Empty or undefined is valid (no subpath)
  if (!subPath || subPath.trim() === '') {
    return '';
  }

  const trimmed = subPath.trim();

  // Reject absolute paths
  if (path.isAbsolute(trimmed)) {
    throw new Error('Absolute paths not allowed in subPath');
  }

  // Reject parent directory references (..)
  if (trimmed.includes('..')) {
    throw new Error('Parent directory references (..) not allowed in subPath');
  }

  // Reject paths starting with / or \ (Windows)
  if (trimmed.startsWith('/') || trimmed.startsWith('\\')) {
    throw new Error('subPath must be relative (cannot start with / or \\)');
  }

  // Reject null bytes (path truncation attack)
  if (trimmed.includes('\0')) {
    throw new Error('Null bytes not allowed in subPath');
  }

  // Max length validation (prevent resource exhaustion)
  if (trimmed.length > 200) {
    throw new Error('subPath too long (max 200 characters)');
  }

  // Allowlist: alphanumeric, dash, underscore, forward slash
  // This prevents special characters that might be interpreted by the shell or filesystem
  if (!/^[a-zA-Z0-9_\-/]+$/.test(trimmed)) {
    throw new Error('subPath contains invalid characters (only alphanumeric, -, _, / allowed)');
  }

  return trimmed;
}

/**
 * Validate that a resolved file path is within a base directory
 *
 * This is the CRITICAL defense against path traversal - even if sanitization
 * is bypassed, this check ensures the final destination is within bounds.
 *
 * @param filePath - The target file path (absolute or relative)
 * @param baseDir - The base directory that must contain the file
 * @returns true if filePath is within baseDir
 * @throws Error if filePath is outside baseDir
 */
export async function validatePathWithinBase(
  filePath: string,
  baseDir: string
): Promise<void> {
  // Resolve to absolute paths (handles relative paths and normalizes ..)
  const resolvedFilePath = path.resolve(filePath);
  const resolvedBaseDir = path.resolve(baseDir);

  // Check if file path starts with base directory
  // Must add path separator to prevent false positives:
  // /vault-evil should not match /vault
  const normalizedBase = resolvedBaseDir.endsWith(path.sep)
    ? resolvedBaseDir
    : resolvedBaseDir + path.sep;

  if (!resolvedFilePath.startsWith(normalizedBase)) {
    throw new Error(
      `Security violation: Destination path is outside vault directory. ` +
      `Attempted path: ${resolvedFilePath}, Base: ${resolvedBaseDir}`
    );
  }

  // Additional check: Verify parent directory exists and resolve symlinks
  // This prevents symlink-based traversal attacks
  try {
    const parentDir = path.dirname(filePath);

    // Ensure parent directory exists (create if needed is handled elsewhere)
    // Here we just check if it exists
    try {
      await fs.access(parentDir);

      // Resolve symlinks in parent directory
      const realParentPath = await fs.realpath(parentDir);

      // Verify real path is also within base
      if (!realParentPath.startsWith(normalizedBase)) {
        throw new Error(
          `Security violation: Symlink traversal detected. ` +
          `Real path: ${realParentPath}, Base: ${resolvedBaseDir}`
        );
      }
    } catch (err: any) {
      // Parent doesn't exist yet - that's okay, it will be created
      // But we still validate the intended path is within base
      if (err.code !== 'ENOENT') {
        // Re-throw if it's not a "file not found" error
        throw err;
      }
    }
  } catch (err: any) {
    if (err.message?.includes('Security violation')) {
      throw err; // Re-throw security errors
    }
    // Log other errors but don't fail (e.g., permission issues)
    console.warn(`Path validation warning: ${err.message}`);
  }
}

/**
 * Validate that a PARA folder name is valid
 *
 * @param folder - PARA folder name (inbox, projects, areas, resources, archive)
 * @returns true if valid
 * @throws Error if invalid
 */
export function validatePARAFolder(
  folder: string
): asserts folder is 'inbox' | 'projects' | 'areas' | 'resources' | 'archive' {
  const validFolders = ['inbox', 'projects', 'areas', 'resources', 'archive'];

  if (!validFolders.includes(folder)) {
    throw new Error(
      `Invalid PARA folder: "${folder}". Must be one of: ${validFolders.join(', ')}`
    );
  }
}

/**
 * Sanitize and validate a project name to prevent path traversal
 *
 * Project names are used in directory paths like: 1-projects/project-{name}/
 * This function prevents attacks like: "../../../etc/passwd"
 *
 * @param projectName - User-provided project name
 * @returns Sanitized project name
 * @throws Error if projectName contains malicious patterns
 */
export function sanitizeProjectName(projectName: string | undefined): string {
  // Empty or undefined is invalid
  if (!projectName || projectName.trim() === '') {
    throw new Error('Project name cannot be empty');
  }

  const trimmed = projectName.trim();

  // Reject absolute paths
  if (path.isAbsolute(trimmed)) {
    throw new Error('Absolute paths not allowed in project name');
  }

  // Reject parent directory references (..)
  if (trimmed.includes('..')) {
    throw new Error('Parent directory references (..) not allowed in project name');
  }

  // Reject paths with slashes (project names should be single directory names)
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    throw new Error('Slashes not allowed in project name (must be a single directory name)');
  }

  // Reject null bytes (path truncation attack)
  if (trimmed.includes('\0')) {
    throw new Error('Null bytes not allowed in project name');
  }

  // Max length validation (prevent resource exhaustion)
  if (trimmed.length > 100) {
    throw new Error('Project name too long (max 100 characters)');
  }

  // Allowlist: alphanumeric, dash, underscore only
  // More restrictive than subPath since project names are used as directory names
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
    throw new Error('Project name contains invalid characters (only alphanumeric, -, _ allowed)');
  }

  // Reject reserved names (Windows reserved names)
  const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reserved.includes(trimmed.toUpperCase())) {
    throw new Error(`Project name "${trimmed}" is a reserved system name`);
  }

  // Reject names starting with . (hidden files)
  if (trimmed.startsWith('.')) {
    throw new Error('Project name cannot start with . (hidden files not allowed)');
  }

  return trimmed;
}
