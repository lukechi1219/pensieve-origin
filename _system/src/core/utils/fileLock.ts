/**
 * File locking utility to prevent race conditions
 * Uses proper-lockfile for atomic file operations
 *
 * Fixes: BUG-001 (File System Race Conditions)
 */

import * as lockfile from 'proper-lockfile';
import path from 'path';

interface LockOptions {
  timeout?: number; // Max time to wait for lock in ms (default: 5000)
  retries?: number; // Number of retry attempts (default: 5)
  stale?: number; // Consider lock stale after ms (default: 10000)
}

const DEFAULT_OPTIONS: Required<LockOptions> = {
  timeout: 5000,
  retries: 5,
  stale: 10000,
};

/**
 * Execute a function with file lock
 * Ensures atomic file operations by acquiring exclusive lock
 *
 * @param filePath - Path to file to lock
 * @param fn - Async function to execute while holding lock
 * @param options - Lock configuration options
 * @returns Result of fn()
 * @throws Error if unable to acquire lock or fn() fails
 */
export async function withFileLock<T>(
  filePath: string,
  fn: () => Promise<T>,
  options: LockOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Normalize path for consistent locking
  const normalizedPath = path.resolve(filePath);

  let release: (() => Promise<void>) | null = null;

  try {
    // Acquire lock
    release = await lockfile.lock(normalizedPath, {
      retries: {
        retries: opts.retries,
        minTimeout: 100,
        maxTimeout: 1000,
      },
      stale: opts.stale,
      realpath: false, // Don't resolve symlinks (security)
    });

    // Execute function while holding lock
    const result = await fn();

    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Lock file is already being held')) {
      throw new Error(`Failed to acquire lock for ${filePath}: File is locked by another process`);
    }
    throw error;
  } finally {
    // Always release lock, even if fn() throws
    if (release) {
      try {
        await release();
      } catch (releaseError) {
        console.error(`Failed to release lock for ${filePath}:`, releaseError);
        // Don't throw - we don't want to mask the original error
      }
    }
  }
}

/**
 * Check if file is currently locked
 *
 * @param filePath - Path to file
 * @returns true if file is locked, false otherwise
 */
export async function isLocked(filePath: string): Promise<boolean> {
  const normalizedPath = path.resolve(filePath);

  try {
    return await lockfile.check(normalizedPath, {
      realpath: false,
      stale: DEFAULT_OPTIONS.stale,
    });
  } catch (error) {
    // If check fails, assume not locked
    return false;
  }
}

/**
 * Manually unlock a file (use with caution!)
 * Only use this if you're certain the lock is stale/orphaned
 *
 * @param filePath - Path to file
 */
export async function unlock(filePath: string): Promise<void> {
  const normalizedPath = path.resolve(filePath);

  try {
    await lockfile.unlock(normalizedPath, {
      realpath: false,
    });
  } catch (error) {
    // Ignore errors if file wasn't locked
    if (error instanceof Error && !error.message.includes('not locked')) {
      throw error;
    }
  }
}

/**
 * Retry-based lock acquisition with exponential backoff
 * Use this for high-contention scenarios
 *
 * @param filePath - Path to file to lock
 * @param fn - Function to execute
 * @param maxRetries - Maximum retry attempts (default: 10)
 * @returns Result of fn()
 */
export async function withRetriedFileLock<T>(
  filePath: string,
  fn: () => Promise<T>,
  maxRetries: number = 10
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await withFileLock(filePath, fn, {
        timeout: 2000 + attempt * 1000, // Exponential backoff
        retries: 3,
      });
    } catch (error) {
      lastError = error as Error;

      // If not a lock error, throw immediately
      if (!error || !(error as Error).message.includes('Lock file')) {
        throw error;
      }

      // Exponential backoff
      const backoffMs = Math.min(100 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error(
    `Failed to acquire lock after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}
