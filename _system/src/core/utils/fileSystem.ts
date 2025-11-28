import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { withFileLock } from './fileLock.js';

/**
 * Ensure directory exists, create if not
 */
export async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Read file content
 */
export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Write file content, create parent directories if needed
 * Uses file locking to prevent race conditions (BUG-001 fix)
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));

  // Acquire file lock before writing to prevent corruption
  await withFileLock(filePath, async () => {
    await fs.writeFile(filePath, content, 'utf-8');
  });
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * List all files in directory (optionally recursive)
 */
export async function listFiles(
  dirPath: string,
  options: { recursive?: boolean; extension?: string } = {}
): Promise<string[]> {
  const { recursive = false, extension } = options;
  const files: string[] = [];

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        if (!extension || fullPath.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(dirPath);
  return files;
}

/**
 * Get file modification time
 */
export async function getFileModTime(filePath: string): Promise<Date> {
  const stats = await fs.stat(filePath);
  return stats.mtime;
}

/**
 * Copy file
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  await ensureDir(path.dirname(destination));
  await fs.copyFile(source, destination);
}

/**
 * Move file
 * Uses file locking to prevent race conditions (BUG-001 fix)
 */
export async function moveFile(source: string, destination: string): Promise<void> {
  await ensureDir(path.dirname(destination));

  // Lock both source and destination to prevent conflicts
  await withFileLock(source, async () => {
    await fs.rename(source, destination);
  });
}

/**
 * Delete file
 * Uses file locking to prevent race conditions (BUG-001 fix)
 */
export async function deleteFile(filePath: string): Promise<void> {
  // Lock file before deleting to prevent concurrent access
  await withFileLock(filePath, async () => {
    await fs.unlink(filePath);
  });
}

/**
 * List subdirectories in a directory
 */
export async function listDirectories(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}
