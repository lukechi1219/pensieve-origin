/**
 * Generic cache manager with TTL (Time To Live) support
 * Provides granular cache invalidation and automatic expiration
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum number of entries (default: 1000)
}

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
  }

  /**
   * Get item from cache
   * Returns null if expired or doesn't exist
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set item in cache with optional custom TTL
   */
  set(key: string, data: T, ttl?: number): void {
    // Enforce max size by removing oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Delete specific item from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete items matching a pattern (e.g., "note:*", "*:project-name")
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get all keys (including expired ones)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Global cache instances for different data types
 */
export const notesCache = new CacheManager<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
});

export const journalsCache = new CacheManager<any>({
  ttl: 2 * 60 * 1000, // 2 minutes (journals change more frequently)
  maxSize: 500,
});

export const projectsCache = new CacheManager<any>({
  ttl: 10 * 60 * 1000, // 10 minutes (projects change less frequently)
  maxSize: 200,
});

/**
 * Cleanup interval (run every 5 minutes)
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(): void {
  if (cleanupInterval) {
    return; // Already running
  }

  cleanupInterval = setInterval(() => {
    const notesClean = notesCache.cleanup();
    const journalsClean = journalsCache.cleanup();
    const projectsClean = projectsCache.cleanup();

    if (notesClean + journalsClean + projectsClean > 0) {
      console.log(`[Cache] Cleaned up ${notesClean + journalsClean + projectsClean} expired entries`);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
